import Order from '#models/order'
import type { OrderItem } from '#models/order'
import Product from '#models/product'
import SellerOrder from '#models/seller_order'
import type { SellerOrderItem } from '#models/seller_order'
import SellerReturn from '#models/seller_return'
import type { SellerReturnItem, SellerReturnStatus } from '#models/seller_return'
import User from '#models/user'
import { pushTimeline } from '#utils/seller_order_detail'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/** Open or accepted requests reserve quantity so the same unit cannot be requested twice. */
const QTY_HOLD_STATUSES: SellerReturnStatus[] = [
  'requested',
  'approved',
  'received',
  'processing',
  'completed',
]

/** Only accepted requests count toward marking the whole order returned. */
const COVER_STATUSES: SellerReturnStatus[] = ['approved', 'received', 'processing', 'completed']

export class ReturnRequestError extends Error {
  constructor(
    public status: number,
    public field: string,
    message: string
  ) {
    super(message)
  }
}

export type CustomerReturnInput = {
  reason: string
  photos?: string[]
  items: { productId: string; qty: number; variantId?: string | null }[]
}

function lineKey(item: { productId: string; variantId?: string | null; variantLabel?: string | null }) {
  return `${item.productId}::${item.variantId || ''}::${(item.variantLabel || '').trim()}`
}

function isPhotoUrl(url: string) {
  return url.startsWith('/uploads/') || url.startsWith('http://') || url.startsWith('https://')
}

function heldQty(returns: SellerReturn[], statuses: SellerReturnStatus[]) {
  const totals = new Map<string, number>()
  for (const row of returns) {
    if (!statuses.includes(row.status)) continue
    for (const item of row.items || []) {
      const key = lineKey(item)
      totals.set(key, (totals.get(key) || 0) + (Number(item.qty) || 0))
    }
  }
  return totals
}

function orderFullyCovered(items: SellerOrderItem[], covered: Map<string, number>) {
  if (!items.length) return false
  return items.every((item) => (covered.get(lineKey(item)) || 0) >= Number(item.qty || 0))
}

export async function syncSellerOrderReturnStatus(order: SellerOrder) {
  if (order.status === 'cancelled') return order

  const returns = await SellerReturn.query().where('order_id', order.id)
  const covered = heldQty(returns, COVER_STATUSES)
  const full = orderFullyCovered(order.items || [], covered)

  if (full && order.status !== 'returned') {
    const previous = order.status
    order.status = 'returned'
    pushTimeline(order, 'مرجوعی سفارش', 'سیستم', `${previous} → returned`)
    await order.save()
  } else if (!full && order.status === 'returned') {
    order.status = 'delivered'
    pushTimeline(order, 'بازگشت از مرجوعی', 'سیستم', 'returned → delivered')
    await order.save()
  }

  return order
}

function matchBuyerLine(items: OrderItem[], request: CustomerReturnInput['items'][number]) {
  const candidates = items.filter((item) => item.productId === request.productId)
  if (request.variantId) {
    return candidates.find((item) => (item.variantId || '') === request.variantId) || null
  }
  if (candidates.length === 1) return candidates[0]
  return null
}

function sellerForLine(sellerOrders: SellerOrder[], line: OrderItem) {
  const owner = sellerOrders.find((order) =>
    (order.items || []).some(
      (item) =>
        item.productId === line.productId
        && (!line.variantId || !item.variantId || item.variantId === line.variantId)
    )
  )
  if (owner) return owner
  return sellerOrders.length === 1 ? sellerOrders[0] : null
}

export async function listCustomerReturns(user: User, orderId: string) {
  const order = await Order.query()
    .where('user_id', user.id)
    .where('id', orderId)
    .preload('sellerOrders')
    .first()
  if (!order) {
    throw new ReturnRequestError(404, 'id', 'سفارش یافت نشد')
  }
  const sellerIds = order.sellerOrders.map((row) => row.id)
  if (!sellerIds.length) return []
  const rows = await SellerReturn.query()
    .whereIn('order_id', sellerIds)
    .orderBy('created_at', 'desc')
  return rows.map((row) => row.toAdminJSON())
}

export async function createCustomerReturns(user: User, orderId: string, input: CustomerReturnInput) {
  const reason = input.reason.trim()
  if (!reason) {
    throw new ReturnRequestError(422, 'reason', 'دلیل مرجوعی را بنویسید')
  }

  const photos = (input.photos || []).map((url) => url.trim()).filter(Boolean)
  if (photos.length > 5) {
    throw new ReturnRequestError(422, 'photos', 'حداکثر ۵ تصویر می‌توانید اضافه کنید')
  }
  if (photos.some((url) => !isPhotoUrl(url))) {
    throw new ReturnRequestError(422, 'photos', 'آدرس تصویر معتبر نیست')
  }

  if (!input.items.length) {
    throw new ReturnRequestError(422, 'items', 'حداقل یک کالا را برای مرجوعی انتخاب کنید')
  }

  const order = await Order.query()
    .where('user_id', user.id)
    .where('id', orderId)
    .preload('sellerOrders')
    .first()
  if (!order) {
    throw new ReturnRequestError(404, 'id', 'سفارش یافت نشد')
  }
  if (!order.sellerOrders.length) {
    throw new ReturnRequestError(422, 'order', 'این سفارش برای مرجوعی ثبت نشده است')
  }

  const grouped = new Map<string, { seller: SellerOrder; items: Array<SellerReturnItem & { orderedQty: number }> }>()

  for (const request of input.items) {
    const qty = Math.round(Number(request.qty))
    if (!Number.isFinite(qty) || qty < 1) {
      throw new ReturnRequestError(422, 'items', 'تعداد مرجوعی معتبر نیست')
    }
    const line = matchBuyerLine(order.items || [], request)
    if (!line) {
      throw new ReturnRequestError(422, 'items', 'کالای انتخاب‌شده در این سفارش نیست')
    }
    if (qty > Number(line.qty)) {
      throw new ReturnRequestError(422, 'items', 'تعداد مرجوعی از تعداد سفارش بیشتر است')
    }

    const seller = sellerForLine(order.sellerOrders, line)
    if (!seller) {
      throw new ReturnRequestError(422, 'items', 'کالای انتخاب‌شده به سفارش فروشنده وصل نیست')
    }
    if (seller.status !== 'delivered') {
      throw new ReturnRequestError(422, 'order', 'فقط سفارش تحویل‌شده قابل مرجوعی است')
    }

    const product = await Product.find(line.productId)
    const bucket = grouped.get(seller.id) ?? { seller, items: [] }
    const key = lineKey({
      productId: line.productId,
      variantId: line.variantId,
      variantLabel: line.variantLabel,
    })
    const existing = bucket.items.find((item) => lineKey(item) === key)
    if (existing) existing.qty += qty
    else {
      bucket.items.push({
        productId: line.productId,
        productTitle: product?.title || line.productId,
        variantId: line.variantId ?? null,
        variantLabel: line.variantLabel || null,
        sku: product?.sku || line.productId,
        qty,
        unitPrice: Math.max(0, Math.round(Number(line.price) || 0)),
        orderedQty: Number(line.qty) || qty,
      })
    }
    grouped.set(seller.id, bucket)
  }

  const sellerIds = [...grouped.keys()]
  const existing = await SellerReturn.query().whereIn('order_id', sellerIds)
  const heldByOrder = new Map<string, Map<string, number>>()
  for (const sellerId of sellerIds) {
    heldByOrder.set(
      sellerId,
      heldQty(
        existing.filter((row) => row.orderId === sellerId),
        QTY_HOLD_STATUSES
      )
    )
  }

  for (const { seller, items } of grouped.values()) {
    const held = heldByOrder.get(seller.id) || new Map()
    for (const item of items) {
      const ordered = (seller.items || [])
        .filter((line) => lineKey(line) === lineKey(item))
        .reduce((sum, line) => sum + Number(line.qty || 0), 0)
      const cap = ordered > 0 ? ordered : item.orderedQty
      const remaining = cap - (held.get(lineKey(item)) || 0)
      if (item.qty > remaining) {
        throw new ReturnRequestError(
          422,
          'items',
          remaining > 0
            ? `از «${item.productTitle}» فقط ${remaining.toLocaleString('fa-IR')} عدد قابل مرجوعی است`
            : `«${item.productTitle}» قبلاً برای مرجوعی ثبت شده است`
        )
      }
    }
  }

  const customerName = order.address?.fullName || 'مشتری'

  const created = await db.transaction(async (trx) => {
    const rows: SellerReturn[] = []
    for (const { seller, items } of grouped.values()) {
      const row = await SellerReturn.create(
        {
          id: `RET-${Date.now().toString(36).toUpperCase()}${rows.length}`,
          orderId: seller.id,
          customerId: String(user.id),
          customerName,
          status: 'requested',
          reason,
          adminNote: '',
          requestedAt: DateTime.now(),
          items: items.map((item) => {
            const { orderedQty: _ordered, ...rest } = item
            void _ordered
            return rest
          }),
          photos,
        },
        { client: trx }
      )
      seller.useTransaction(trx)
      pushTimeline(seller, 'ثبت مرجوعی', customerName, row.id)
      await seller.save()
      rows.push(row)
    }
    return rows
  })

  return created.map((row) => row.toAdminJSON())
}
