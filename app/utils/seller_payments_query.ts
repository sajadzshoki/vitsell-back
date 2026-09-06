import SellerOrder from '#models/seller_order'
import { attachOrderListCommerce } from '#utils/seller_order_detail'
import type { SellerPaymentsQuery } from '#validators/seller_payments'

export type SellerFinancePaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'

export type SellerPaymentRow = {
  id: string
  orderId: string
  customerId: string | null
  customerName: string
  amount: number
  currency: string
  paymentMethod: string
  gateway: string
  status: SellerFinancePaymentStatus
  authority: string | null
  refId: string | null
  cardPan: string | null
  transactionId: string
  adminNote: string
  createdAt: string
  completedAt: string | null
  reviewedAt: string | null
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

function mapStatus(
  commerceStatus: string | undefined,
  paymentStatus: string | undefined,
): SellerFinancePaymentStatus {
  const c = String(commerceStatus || '')
  if (c === 'refunded') return 'refunded'
  if (c === 'partially_refunded') return 'partially_refunded'
  if (c === 'failed') return 'failed'
  if (c === 'pending') return 'pending'
  if (c === 'paid') return 'successful'

  const p = String(paymentStatus || '')
  if (p === 'paid') return 'successful'
  if (p === 'pending') return 'pending'
  if (p === 'failed' || p === 'cancelled') return 'failed'
  return 'successful'
}

function projectOrderPayment(order: {
  id: string
  total: number
  paymentMethod: string
  customerName: string
  date: string
  commerce?: any
  payment?: any
}): SellerPaymentRow {
  const commerce = order.commerce || {}
  const payment = order.payment
  const status = mapStatus(commerce.paymentStatus, payment?.status)
  const completed =
    status === 'successful' || status === 'refunded' || status === 'partially_refunded'
  const amount = Number(payment?.amount) || Number(order.total) || 0
  const refId = payment?.refId || commerce.paymentRefId || commerce.transactionId || null
  const authority = payment?.authority || commerce.paymentAuthority || null
  const cardPan = payment?.cardPan || commerce.paymentCardPan || null
  const createdAt = String(payment?.createdAt || commerce.paymentDate || order.date || '')

  return {
    id: `pay-${order.id}`,
    orderId: order.id,
    customerId: commerce.customerId != null ? String(commerce.customerId) : null,
    customerName: String(order.customerName || ''),
    amount,
    currency: 'IRR',
    paymentMethod: String(order.paymentMethod || ''),
    gateway: inferGateway(String(order.paymentMethod || '')),
    status,
    authority: authority ? String(authority) : null,
    refId: refId ? String(refId) : null,
    cardPan: cardPan ? String(cardPan) : null,
    transactionId: String(refId || authority || `txn-${order.id}`),
    adminNote: '',
    createdAt,
    completedAt: completed ? createdAt : null,
    reviewedAt: null,
  }
}

function applyFilters(rows: SellerPaymentRow[], filters: SellerPaymentsQuery) {
  let list = rows
  const q = filters.q?.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q)
        || p.orderId.toLowerCase().includes(q)
        || (p.refId || '').toLowerCase().includes(q)
        || (p.authority || '').toLowerCase().includes(q)
        || p.customerName.toLowerCase().includes(q)
        || p.gateway.toLowerCase().includes(q),
    )
  }
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'pending') {
      list = list.filter((p) => p.status === 'pending' || p.status === 'processing')
    }
    else if (filters.status === 'refunded') {
      list = list.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded')
    }
    else {
      list = list.filter((p) => p.status === filters.status)
    }
  }
  if (filters.gateway && filters.gateway !== 'all') {
    list = list.filter((p) => p.gateway === filters.gateway)
  }
  if (filters.orderId?.trim()) {
    list = list.filter((p) => p.orderId === filters.orderId!.trim())
  }
  return list
}

function statusCounts(rows: SellerPaymentRow[]) {
  const counts: Record<string, number> = { all: rows.length }
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1
  }
  counts.pending_group =
    (counts.pending || 0) + (counts.processing || 0)
  counts.refunded_group =
    (counts.refunded || 0) + (counts.partially_refunded || 0)
  return counts
}

export async function buildSellerPayments(): Promise<SellerPaymentRow[]> {
  const orders = await SellerOrder.query()
    .orderBy('date_key', 'desc')
    .orderBy('id', 'desc')
    .limit(500)
  const orderRows = await attachOrderListCommerce(orders)
  return orderRows
    .map((row) => projectOrderPayment(row as any))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function querySellerPayments(filters: SellerPaymentsQuery) {
  const ledger = await buildSellerPayments()
  const filtered = applyFilters(ledger, filters)
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(500, Math.max(1, Number(filters.pageSize) || (wantAll ? 500 : 20)))
  const items = wantAll
    ? filtered.slice(0, pageSize)
    : filtered.slice((page - 1) * pageSize, page * pageSize)

  const gateways = [
    ...new Set(ledger.map((p) => p.gateway).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'fa'))

  return {
    items,
    total: filtered.length,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: statusCounts(ledger),
    gatewayOptions: gateways,
  }
}

export async function findSellerPayment(id: string) {
  const trimmed = String(id || '').trim()
  if (!trimmed) return null
  const ledger = await buildSellerPayments()
  const direct = ledger.find((p) => p.id === trimmed)
  if (direct) return direct
  // accept bare order id or pay-<orderId>
  const orderId = trimmed.startsWith('pay-') ? trimmed.slice(4) : trimmed
  return ledger.find((p) => p.orderId === orderId || p.id === `pay-${orderId}`) || null
}
