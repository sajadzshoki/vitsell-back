import Order from '#models/order'
import Payment from '#models/payment'
import SellerOrder, { type SellerOrderStatus } from '#models/seller_order'
import Profile from '#models/profile'
import { DateTime } from 'luxon'

export type OrderTimelineEvent = {
  id: string
  event: string
  at: string
  actor: string
  detail?: string
}

export type OrderInternalNote = {
  id: string
  text: string
  author: string
  createdAt: string
}

export type OrderRefundRecord = {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transactionId: string
  createdAt: string
  actorName: string
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

function mapShippingStatus(status: SellerOrderStatus) {
  if (status === 'new') return 'unfulfilled' as const
  if (status === 'packing') return 'ready' as const
  if (status === 'shipped') return 'shipped' as const
  if (status === 'delivered') return 'delivered' as const
  if (status === 'returned') return 'returned' as const
  return 'unfulfilled' as const
}

function mapPaymentStatus(
  order: SellerOrder,
  payment: Payment | null,
  refundedAmount: number,
) {
  if (order.status === 'cancelled') return 'failed' as const
  if (refundedAmount > 0 && refundedAmount >= Number(order.total)) return 'refunded' as const
  if (refundedAmount > 0) return 'partially_refunded' as const
  if (order.status === 'returned') return 'partially_refunded' as const
  if (payment) {
    if (payment.status === 'paid') return 'paid' as const
    if (payment.status === 'pending') return 'pending' as const
    if (payment.status === 'failed' || payment.status === 'cancelled') return 'failed' as const
  }
  // COD / in-person typically treated as paid once order is accepted
  if (String(order.paymentMethod || '').includes('محل')) {
    return order.status === 'new' ? ('pending' as const) : ('paid' as const)
  }
  return 'paid' as const
}

function mapReturnStatus(status: SellerOrderStatus) {
  return status === 'returned' ? ('completed' as const) : ('none' as const)
}

function mapRefundStatus(refundedAmount: number, status: SellerOrderStatus) {
  if (refundedAmount > 0) return 'partial' as const
  if (status === 'returned') return 'partial' as const
  return 'none' as const
}

function ensureTimeline(order: SellerOrder): OrderTimelineEvent[] {
  const existing = asArray<OrderTimelineEvent>((order as any).timeline)
  if (existing.length) return existing
  return [
    {
      id: `${order.id}-created`,
      event: 'ثبت سفارش',
      at: order.date || order.createdAt?.toISO() || new Date().toISOString(),
      actor: 'سیستم',
      detail: order.customerName,
    },
  ]
}

export function pushTimeline(
  order: SellerOrder,
  event: string,
  actor: string,
  detail?: string,
) {
  const timeline = ensureTimeline(order)
  const next: OrderTimelineEvent = {
    id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    event,
    at: DateTime.now().toISO() || new Date().toISOString(),
    actor,
    detail,
  }
  ;(order as any).timeline = [next, ...timeline]
  return next
}

export async function buildSellerOrderDetail(order: SellerOrder) {
  let buyerOrder: Order | null = null
  let payment: Payment | null = null
  let customerEmail = ''
  let customerId: string | null = null

  if (order.buyerOrderId) {
    buyerOrder = await Order.find(order.buyerOrderId)
    if (buyerOrder) {
      payment = await Payment.query().where('order_id', buyerOrder.id).first()
      customerId = String(buyerOrder.userId)
      const profile = await Profile.query().where('user_id', buyerOrder.userId).first()
      customerEmail = String(profile?.email || '')
    }
  }

  const refundedAmount = Number((order as any).refundedAmount) || 0
  const refunds = asArray<OrderRefundRecord>((order as any).refunds)
  const timeline = ensureTimeline(order)
  const internalNotes = asArray<OrderInternalNote>((order as any).internalNotes)
  const discountAmount = Number(buyerOrder?.discountAmount) || 0
  const shippingCost = Number(buyerOrder?.shippingCost) || 0
  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0,
  )

  const paymentStatus = mapPaymentStatus(order, payment, refundedAmount)
  const shippingStatus = mapShippingStatus(order.status)
  const returnStatus = mapReturnStatus(order.status)
  const refundStatus = mapRefundStatus(refundedAmount, order.status)

  const commerce = {
    orderId: order.id,
    paymentStatus,
    shippingStatus,
    returnStatus,
    refundStatus,
    trackingCode: String((order as any).trackingCode || ''),
    estimatedDelivery: String((order as any).estimatedDelivery || ''),
    carrier: String((order as any).carrier || order.shippingMethod || ''),
    transactionId: String(payment?.refId || payment?.authority || ''),
    paymentDate: payment?.createdAt?.toISO() || order.date,
    discountAmount,
    shippingCost,
    taxAmount: 0,
    customerEmail,
    customerId,
    timeline,
    internalNotes,
    refundedAmount,
    refunds,
  }

  return {
    ...order.toJSON(),
    buyerOrderId: order.buyerOrderId,
    commerce,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          amount: Number(payment.amount) || 0,
          refId: payment.refId,
          authority: payment.authority,
          cardPan: payment.cardPan,
          createdAt: payment.createdAt?.toISO() ?? null,
        }
      : null,
    buyerOrder: buyerOrder
      ? {
          id: buyerOrder.id,
          status: buyerOrder.status,
          discountCode: buyerOrder.discountCode,
          discountAmount,
          shippingCost,
          total: Number(buyerOrder.total) || 0,
        }
      : null,
    invoice: {
      id: order.id,
      buyerOrderId: order.buyerOrderId,
      date: order.date,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail,
      address: order.address,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      trackingCode: commerce.trackingCode,
      items: items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        lineTotal: Number(item.price || 0) * Number(item.qty || 0),
      })),
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount: 0,
      total: Number(order.total) || 0,
      refundedAmount,
    },
  }
}
