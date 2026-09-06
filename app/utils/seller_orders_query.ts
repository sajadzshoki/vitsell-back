import SellerOrder from '#models/seller_order'
import type { OrdersQuery } from '#validators/orders'
import { attachOrderListCommerce } from '#utils/seller_order_detail'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type OrderQuery = ModelQueryBuilderContract<typeof SellerOrder, SellerOrder>

function applyDerivedPayment(q: OrderQuery, payment: string) {
  // Mirrors FE emptyOrderCommerce mapPaymentFromOrder until real payment columns exist
  if (payment === 'failed') return q.where('status', 'cancelled')
  if (payment === 'partially_refunded') return q.where('status', 'returned')
  if (payment === 'paid') {
    return q.whereIn('status', ['new', 'packing', 'shipped', 'delivered'])
  }
  if (payment === 'pending' || payment === 'refunded') {
    // Not represented in current schema → empty set
    return q.whereRaw('1 = 0')
  }
  return q
}

function applyDerivedShipping(q: OrderQuery, shipping: string) {
  // Mirrors FE mapShippingFromOrder
  if (shipping === 'unfulfilled') return q.whereIn('status', ['new', 'cancelled'])
  if (shipping === 'ready') return q.where('status', 'packing')
  if (shipping === 'shipped') return q.where('status', 'shipped')
  if (shipping === 'delivered') return q.where('status', 'delivered')
  if (shipping === 'returned') return q.where('status', 'returned')
  return q
}

export function applyOrderFilters(
  query: OrderQuery,
  filters: OrdersQuery,
  options?: { includeStatus?: boolean },
) {
  let q = query
  const includeStatus = options?.includeStatus !== false

  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }

  if (filters.payment && filters.payment !== 'all') {
    q = applyDerivedPayment(q, filters.payment)
  }
  if (filters.shipping && filters.shipping !== 'all') {
    q = applyDerivedShipping(q, filters.shipping)
  }

  if (filters.paymentMethod?.trim() && filters.paymentMethod !== 'all') {
    q = q.where('payment_method', filters.paymentMethod.trim())
  }

  if (filters.amountMin != null && Number.isFinite(filters.amountMin)) {
    q = q.where('total', '>=', Math.round(filters.amountMin))
  }
  if (filters.amountMax != null && Number.isFinite(filters.amountMax)) {
    q = q.where('total', '<=', Math.round(filters.amountMax))
  }

  const dateFrom = filters.dateFrom?.trim()
  if (dateFrom) q = q.where('date_key', '>=', dateFrom.slice(0, 10))
  const dateTo = filters.dateTo?.trim()
  if (dateTo) q = q.where('date_key', '<=', dateTo.slice(0, 10))

  // Discount not stored on seller_orders yet
  if (filters.hasDiscount === true) {
    q = q.whereRaw('1 = 0')
  }
  if (filters.hasRefund === true || filters.hasReturn === true) {
    q = q.where('status', 'returned')
  }

  if (filters.needsTracking === true) {
    q = q
      .whereIn('status', ['packing', 'shipped'])
      .where((builder) => {
        builder.whereNull('tracking_code').orWhere('tracking_code', '')
      })
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('customer_name', like)
        .orWhereILike('customer_phone', like)
        .orWhereILike('city', like)
        .orWhereILike('payment_method', like)
        .orWhereILike('shipping_method', like)
        .orWhereRaw(`items::text ILIKE ?`, [like])
        .orWhereExists((sub) => {
          sub
            .from('seller_order_items as soi')
            .leftJoin('products as p', 'p.id', 'soi.product_id')
            .whereRaw('soi.seller_order_id = seller_orders.id')
            .where((inner) => {
              inner
                .whereILike('soi.product_id', like)
                .orWhereILike('p.sku', like)
                .orWhereILike('p.title', like)
            })
        })
    })
  }

  return q
}

function applySort(query: OrderQuery, sort?: string) {
  switch (sort) {
    case 'oldest':
      return query.orderBy('date_key', 'asc').orderBy('id', 'asc')
    case 'amount_desc':
      return query.orderBy('total', 'desc').orderBy('date_key', 'desc')
    case 'amount_asc':
      return query.orderBy('total', 'asc').orderBy('date_key', 'desc')
    case 'newest':
    default:
      return query.orderBy('date_key', 'desc').orderBy('id', 'desc')
  }
}

async function statusCounts(filters: OrdersQuery) {
  const base = () => applyOrderFilters(SellerOrder.query(), filters, { includeStatus: false })
  const statuses = ['new', 'packing', 'shipped', 'delivered', 'returned', 'cancelled'] as const
  const [allRow, ...rows] = await Promise.all([
    base().count('* as total').first(),
    ...statuses.map((status) => base().where('status', status).count('* as total').first()),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const counts: Record<string, number> = { all: num(allRow) }
  statuses.forEach((status, i) => {
    counts[status] = num(rows[i])
  })
  return counts
}

async function paymentMethodOptions() {
  const rows = await db
    .from('seller_orders')
    .select('payment_method')
    .groupBy('payment_method')
    .orderBy('payment_method', 'asc')
  return (rows as Array<{ payment_method: string }>)
    .map((r) => String(r.payment_method || '').trim())
    .filter(Boolean)
}

export async function querySellerOrders(filters: OrdersQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(500, Math.max(1, Number(filters.pageSize) || (wantAll ? 500 : 10)))

  const filtered = applyOrderFilters(SellerOrder.query(), filters)
  const countRow = await applyOrderFilters(SellerOrder.query(), filters)
    .clearOrder()
    .count('* as total')
    .first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  let listQuery = applySort(filtered, filters.sort)
  const orders = wantAll
    ? await listQuery.limit(pageSize)
    : await listQuery.offset((page - 1) * pageSize).limit(pageSize)

  const [counts, methods, items] = await Promise.all([
    statusCounts(filters),
    paymentMethodOptions(),
    attachOrderListCommerce(orders),
  ])

  return {
    items,
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? orders.length : pageSize,
    statusCounts: counts,
    paymentMethodOptions: methods,
  }
}

/** Distinct payment methods for filter dropdowns (unfiltered). */
export async function listOrderPaymentMethods() {
  return paymentMethodOptions()
}
