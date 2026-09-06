import SellerOrder from '#models/seller_order'
import SellerPayout from '#models/seller_payout'
import SellerRefund from '#models/seller_refund'
import { attachOrderListCommerce } from '#utils/seller_order_detail'
import {
  loadFinanceAdjustments,
  projectAdjustmentsToTransactions,
} from '#utils/seller_adjustments'
import type { TransactionsQuery } from '#validators/transactions'

export type SellerFinanceTransactionType =
  | 'payment'
  | 'refund'
  | 'settlement'
  | 'adjustment'
  | 'fee'

export type SellerFinanceTransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type SellerFinanceTransactionRow = {
  id: string
  type: SellerFinanceTransactionType
  amount: number
  signedAmount: number
  status: SellerFinanceTransactionStatus
  paymentMethod: string
  gateway: string
  orderId: string | null
  customerId: string | null
  customerName: string
  reference: string
  paymentId: string | null
  refundId: string | null
  settlementId: string | null
  adjustmentId: string | null
  createdAt: string
  completedAt: string | null
  sourceLabel: string
}

function inferGateway(method: string): string {
  const m = String(method || '').toLowerCase()
  if (m.includes('زرین') || m.includes('zarin')) return 'زرین‌پال'
  if (m.includes('ملت')) return 'ملت'
  if (m.includes('سامان')) return 'سامان'
  if (m.includes('پارسیان')) return 'پارسیان'
  if (m.includes('محل') || m.includes('cod')) return 'پرداخت در محل'
  return 'زرین‌پال'
}

function mapPaymentStatus(status: string): SellerFinanceTransactionStatus {
  if (status === 'paid') return 'completed'
  if (status === 'pending') return 'pending'
  if (status === 'failed' || status === 'cancelled') return 'failed'
  if (status === 'refunded') return 'refunded'
  if (status === 'partially_refunded') return 'refunded'
  return 'pending'
}

function mapCommercePaymentToTxStatus(status: string): SellerFinanceTransactionStatus {
  if (status === 'paid') return 'completed'
  if (status === 'pending') return 'pending'
  if (status === 'failed') return 'failed'
  if (status === 'refunded' || status === 'partially_refunded') return 'refunded'
  return 'pending'
}

function mapRefundStatus(status: string): SellerFinanceTransactionStatus {
  if (status === 'completed') return 'completed'
  if (status === 'pending') return 'pending'
  if (status === 'processing') return 'processing'
  if (status === 'failed') return 'failed'
  if (status === 'cancelled') return 'cancelled'
  return 'pending'
}

function mapSettlementStatus(status: string): SellerFinanceTransactionStatus {
  if (status === 'paid' || status === 'completed' || status === 'reconciled') return 'completed'
  if (status === 'pending') return 'pending'
  if (status === 'processing') return 'processing'
  if (status === 'failed') return 'failed'
  return 'pending'
}

function projectPayments(
  orderRows: Array<{
    id: string
    total: number
    paymentMethod: string
    customerName: string
    date: string
    commerce?: any
    payment?: any
  }>,
): SellerFinanceTransactionRow[] {
  return orderRows.map((order) => {
    const commerce = order.commerce || {}
    const payment = order.payment
    const paymentId = `pay-${order.id}`
    const amount = Number(payment?.amount) || Number(order.total) || 0
    const status = payment
      ? mapPaymentStatus(String(payment.status || 'pending'))
      : mapCommercePaymentToTxStatus(String(commerce.paymentStatus || 'paid'))
    const completed =
      status === 'completed' || status === 'refunded'
    const refId = payment?.refId || commerce.paymentRefId || commerce.transactionId || ''
    const authority = payment?.authority || commerce.paymentAuthority || ''
    return {
      id: `tx-pay-${paymentId}`,
      type: 'payment' as const,
      amount,
      signedAmount: amount,
      status,
      paymentMethod: String(order.paymentMethod || ''),
      gateway: inferGateway(String(order.paymentMethod || '')),
      orderId: order.id,
      customerId: commerce.customerId ? String(commerce.customerId) : null,
      customerName: String(order.customerName || ''),
      reference: String(refId || authority || ''),
      paymentId,
      refundId: null,
      settlementId: null,
      adjustmentId: null,
      createdAt: String(payment?.createdAt || commerce.paymentDate || order.date || ''),
      completedAt: completed
        ? String(payment?.createdAt || commerce.paymentDate || order.date || '')
        : null,
      sourceLabel: 'پرداخت سفارش',
    }
  })
}

function projectRefunds(refunds: SellerRefund[]): SellerFinanceTransactionRow[] {
  return refunds.map((r) => {
    const amount = Number(r.amount) || 0
    const createdAt = r.createdAt?.toISO() || ''
    return {
      id: `tx-ref-${r.id}`,
      type: 'refund' as const,
      amount,
      signedAmount: -Math.abs(amount),
      status: mapRefundStatus(r.status),
      paymentMethod: '',
      gateway: '',
      orderId: r.orderId,
      customerId: null,
      customerName: r.customerName || '',
      reference: r.transactionId || '',
      paymentId: null,
      refundId: r.id,
      settlementId: null,
      adjustmentId: null,
      createdAt,
      completedAt: r.status === 'completed' ? createdAt : null,
      sourceLabel: 'بازپرداخت',
    }
  })
}

function projectSettlements(payouts: SellerPayout[]): SellerFinanceTransactionRow[] {
  const rows: SellerFinanceTransactionRow[] = []
  for (const p of payouts) {
    const amount = Number(p.amount) || 0
    const fees = Number((p as any).fees) || Math.round(amount * 0.01)
    const settlementId = p.id.startsWith('stl-') ? p.id : `stl-${p.id}`
    const settlementStatus =
      (p as any).settlementStatus
      || (p.status === 'paid' ? 'completed' : 'pending')
    const status = mapSettlementStatus(settlementStatus === 'completed' ? 'paid' : settlementStatus)
    const createdAt = p.createdAt?.toISO() || p.date || ''
    const completedAt =
      status === 'completed' ? p.date || createdAt : null
    const gateway = String((p as any).gateway || 'زرین‌پال')
    const reference = String((p as any).reference || (p.status === 'paid' ? `REF-${p.id}` : ''))
    rows.push({
      id: `tx-stl-${settlementId}`,
      type: 'settlement',
      amount,
      signedAmount: Math.max(0, amount - fees),
      status,
      paymentMethod: '',
      gateway,
      orderId: null,
      customerId: null,
      customerName: '—',
      reference,
      paymentId: null,
      refundId: null,
      settlementId,
      adjustmentId: null,
      createdAt,
      completedAt,
      sourceLabel: 'تسویه درگاه/بانک',
    })
    if (fees > 0) {
      rows.push({
        id: `tx-fee-${settlementId}`,
        type: 'fee',
        amount: fees,
        signedAmount: -Math.abs(fees),
        status,
        paymentMethod: '',
        gateway,
        orderId: null,
        customerId: null,
        customerName: '—',
        reference,
        paymentId: null,
        refundId: null,
        settlementId,
        adjustmentId: null,
        createdAt,
        completedAt,
        sourceLabel: 'کارمزد تسویه',
      })
    }
  }
  return rows
}

function applyFilters(rows: SellerFinanceTransactionRow[], filters: TransactionsQuery) {
  let list = rows
  const q = filters.q?.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(q)
        || (t.orderId || '').toLowerCase().includes(q)
        || t.reference.toLowerCase().includes(q)
        || t.customerName.toLowerCase().includes(q)
        || t.gateway.toLowerCase().includes(q),
    )
  }
  if (filters.type && filters.type !== 'all') {
    list = list.filter((t) => t.type === filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    list = list.filter((t) => t.status === filters.status)
  }
  if (filters.gateway && filters.gateway !== 'all') {
    list = list.filter((t) => t.gateway === filters.gateway)
  }
  if (filters.orderId?.trim()) {
    list = list.filter((t) => t.orderId === filters.orderId!.trim())
  }
  return list
}

function countBy<T extends string>(rows: SellerFinanceTransactionRow[], key: 'status' | 'type') {
  const counts: Record<string, number> = { all: rows.length }
  for (const row of rows) {
    const value = String(row[key])
    counts[value] = (counts[value] || 0) + 1
  }
  return counts
}

export async function buildSellerFinanceLedger(): Promise<SellerFinanceTransactionRow[]> {
  const [orders, refunds, payouts, adjustments] = await Promise.all([
    SellerOrder.query().orderBy('date_key', 'desc').orderBy('id', 'desc').limit(500),
    SellerRefund.query().orderBy('created_at', 'desc').limit(200),
    SellerPayout.query().orderBy('created_at', 'desc').limit(200),
    loadFinanceAdjustments(),
  ])
  const orderRows = await attachOrderListCommerce(orders)
  return [
    ...projectPayments(orderRows as any),
    ...projectRefunds(refunds),
    ...projectSettlements(payouts),
    ...projectAdjustmentsToTransactions(adjustments),
  ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function querySellerTransactions(filters: TransactionsQuery) {
  const ledger = await buildSellerFinanceLedger()
  const filtered = applyFilters(ledger, filters)
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(500, Math.max(1, Number(filters.pageSize) || (wantAll ? 500 : 20)))
  const total = filtered.length
  const items = wantAll
    ? filtered.slice(0, pageSize)
    : filtered.slice((page - 1) * pageSize, page * pageSize)

  const gateways = [
    ...new Set(ledger.map((t) => t.gateway).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'fa'))

  return {
    items,
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: countBy(ledger, 'status'),
    typeCounts: countBy(ledger, 'type'),
    gatewayOptions: gateways,
  }
}

export async function findSellerTransaction(id: string) {
  const ledger = await buildSellerFinanceLedger()
  return ledger.find((t) => t.id === id) || null
}
