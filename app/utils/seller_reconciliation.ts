import ContentBlock from '#models/content_block'
import SellerOrder from '#models/seller_order'
import SellerRefund from '#models/seller_refund'
import SellerPayout from '#models/seller_payout'
import { attachOrderListCommerce } from '#utils/seller_order_detail'
import { buildSellerPayments } from '#utils/seller_payments_query'

const RECONCILED_KEY = 'finance_reconciled_ids'

export type FinanceDiscrepancySeverity = 'high' | 'medium' | 'low'

export type FinanceDiscrepancyRow = {
  id: string
  code: string
  severity: FinanceDiscrepancySeverity
  title: string
  detail: string
  orderId: string | null
  paymentId: string | null
  settlementId: string | null
  refundId: string | null
  reconciled: boolean
}

async function loadReconciledIds(): Promise<string[]> {
  const block = await ContentBlock.find(RECONCILED_KEY)
  const raw = block?.value
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map((id) => String(id || '').trim()).filter(Boolean))]
}

async function saveReconciledIds(ids: string[]) {
  const unique = [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))]
  await ContentBlock.updateOrCreate(
    { key: RECONCILED_KEY },
    { key: RECONCILED_KEY, value: unique },
  )
  return unique
}

function detectDiscrepancies(input: {
  orders: Array<{
    id: string
    status: string
    commerce?: any
  }>
  payments: Array<{
    id: string
    orderId: string
    status: string
  }>
  refunds: Array<{
    id: string
    orderId: string
    status: string
    amount: number
  }>
  settlements: Array<{
    id: string
    status: string
    reference: string
  }>
  reconciledIds: Set<string>
}): FinanceDiscrepancyRow[] {
  const issues: FinanceDiscrepancyRow[] = []
  const paymentByOrder = new Map(input.payments.map((p) => [p.orderId, p]))

  for (const order of input.orders) {
    const commerce = order.commerce || {}
    const paymentStatus = String(commerce.paymentStatus || '')
    const pay = paymentByOrder.get(order.id)

    if (
      paymentStatus === 'paid'
      || paymentStatus === 'partially_refunded'
      || paymentStatus === 'refunded'
    ) {
      if (!pay) {
        const id = `disc-paid-no-tx-${order.id}`
        issues.push({
          id,
          code: 'paid_order_missing_transaction',
          severity: 'high',
          title: 'سفارش پرداخت‌شده بدون تراکنش',
          detail: `سفارش ${order.id} وضعیت پرداخت موفق دارد ولی رکورد تراکنش/پرداخت متناظر یافت نشد.`,
          orderId: order.id,
          paymentId: null,
          settlementId: null,
          refundId: null,
          reconciled: input.reconciledIds.has(id),
        })
      }
    }

    if (pay && pay.status === 'successful' && paymentStatus === 'failed') {
      const id = `disc-pay-order-mismatch-${order.id}`
      issues.push({
        id,
        code: 'payment_order_status_mismatch',
        severity: 'high',
        title: 'ناسازگاری وضعیت پرداخت و سفارش',
        detail: `پرداخت ${pay.id} موفق است ولی وضعیت پرداخت سفارش ${order.id} ناموفق است.`,
        orderId: order.id,
        paymentId: pay.id,
        settlementId: null,
        refundId: null,
        reconciled: input.reconciledIds.has(id),
      })
    }

    const refundedAmount = Number(commerce.refundedAmount) || 0
    if (refundedAmount > 0) {
      const completedRefundSum = input.refunds
        .filter((r) => r.orderId === order.id && r.status === 'completed')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
      if (Math.abs(completedRefundSum - refundedAmount) > 1) {
        const id = `disc-refund-amount-${order.id}`
        issues.push({
          id,
          code: 'refund_amount_mismatch',
          severity: 'medium',
          title: 'مغایرت مبلغ بازپرداخت',
          detail: `مجموع بازپرداخت‌های تکمیل‌شده (${completedRefundSum}) با مبلغ ثبت‌شده روی سفارش (${refundedAmount}) هم‌خوان نیست.`,
          orderId: order.id,
          paymentId: pay?.id ?? null,
          settlementId: null,
          refundId: null,
          reconciled: input.reconciledIds.has(id),
        })
      }
    }

    if (order.status === 'delivered' || order.status === 'packing' || order.status === 'shipped') {
      if (pay && pay.status === 'failed') {
        const id = `disc-failed-pay-active-order-${order.id}`
        issues.push({
          id,
          code: 'failed_payment_active_order',
          severity: 'high',
          title: 'پرداخت ناموفق روی سفارش فعال',
          detail: `سفارش ${order.id} در جریان است ولی پرداخت مرتبط ناموفق ثبت شده.`,
          orderId: order.id,
          paymentId: pay.id,
          settlementId: null,
          refundId: null,
          reconciled: input.reconciledIds.has(id),
        })
      }
    }
  }

  for (const s of input.settlements) {
    if ((s.status === 'completed' || s.status === 'reconciled') && !String(s.reference || '').trim()) {
      const id = `disc-stl-ref-${s.id}`
      issues.push({
        id,
        code: 'settlement_missing_reference',
        severity: 'medium',
        title: 'تسویه بدون شماره مرجع',
        detail: `تسویه ${s.id} تکمیل شده ولی شماره مرجع ندارد.`,
        orderId: null,
        paymentId: null,
        settlementId: s.id,
        refundId: null,
        reconciled: input.reconciledIds.has(id),
      })
    }
  }

  return issues.map((i) => ({
    ...i,
    reconciled: input.reconciledIds.has(i.id),
  }))
}

export async function querySellerReconciliation(filters?: {
  q?: string
  severity?: string
  status?: 'all' | 'open' | 'resolved'
}) {
  const [orders, payments, refunds, payouts, reconciledList] = await Promise.all([
    SellerOrder.query().orderBy('date_key', 'desc').orderBy('id', 'desc').limit(500),
    buildSellerPayments(),
    SellerRefund.query().orderBy('created_at', 'desc').limit(200),
    SellerPayout.query().orderBy('created_at', 'desc').limit(200),
    loadReconciledIds(),
  ])

  const orderRows = await attachOrderListCommerce(orders)
  const settlements = payouts.map((p) => p.toSettlementJSON())
  const reconciledIds = new Set(reconciledList)

  let items = detectDiscrepancies({
    orders: orderRows as any,
    payments,
    refunds: refunds.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      status: r.status,
      amount: Number(r.amount) || 0,
    })),
    settlements: settlements.map((s) => ({
      id: s.id,
      status: s.status,
      reference: s.reference,
    })),
    reconciledIds,
  })

  const q = filters?.q?.trim().toLowerCase()
  if (q) {
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q)
        || i.code.toLowerCase().includes(q)
        || i.title.includes(filters!.q!.trim())
        || i.detail.toLowerCase().includes(q)
        || (i.orderId || '').toLowerCase().includes(q)
        || (i.paymentId || '').toLowerCase().includes(q)
        || (i.settlementId || '').toLowerCase().includes(q),
    )
  }
  if (filters?.severity && filters.severity !== 'all') {
    items = items.filter((i) => i.severity === filters.severity)
  }
  if (filters?.status === 'open') {
    items = items.filter((i) => !i.reconciled)
  }
  else if (filters?.status === 'resolved') {
    items = items.filter((i) => i.reconciled)
  }

  const openCount = items.filter((i) => !i.reconciled).length
  const resolvedCount = items.filter((i) => i.reconciled).length
  const severityCounts = {
    all: items.length,
    high: items.filter((i) => i.severity === 'high').length,
    medium: items.filter((i) => i.severity === 'medium').length,
    low: items.filter((i) => i.severity === 'low').length,
  }

  return {
    items,
    total: items.length,
    openCount,
    resolvedCount,
    severityCounts,
    reconciledIds: reconciledList,
    generatedAt: new Date().toISOString(),
  }
}

export async function markDiscrepancyResolved(id: string) {
  const trimmed = String(id || '').trim()
  if (!trimmed) return { ok: false as const, error: 'شناسه نامعتبر است' }
  const current = await loadReconciledIds()
  if (!current.includes(trimmed)) {
    current.push(trimmed)
  }
  const next = await saveReconciledIds(current)
  return { ok: true as const, reconciledIds: next }
}

export async function unmarkDiscrepancyResolved(id: string) {
  const trimmed = String(id || '').trim()
  if (!trimmed) return { ok: false as const, error: 'شناسه نامعتبر است' }
  const current = await loadReconciledIds()
  const next = await saveReconciledIds(current.filter((x) => x !== trimmed))
  return { ok: true as const, reconciledIds: next }
}
