import db from '@adonisjs/lucid/services/db'
import type { CustomersQuery } from '#validators/customers'

export type CustomerStatus = 'active' | 'inactive' | 'blocked'

export type CustomerListRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: CustomerStatus
  registeredAt: string
  lastActivityAt: string
  orderCount: number
  completedOrders: number
  cancelledOrders: number
  returnedOrders: number
  totalSpent: number
  refundTotal: number
  reviewCount: number
  questionCount: number
  wishlistCount: number
  addresses: Array<{
    id: string
    title: string
    recipient: string
    phone: string
    province: string
    city: string
    address: string
    postalCode: string
    isDefault: boolean
  }>
}

function num(v: unknown) {
  return Number(v) || 0
}

function iso(v: unknown) {
  if (!v) return new Date().toISOString()
  if (v instanceof Date) return v.toISOString()
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function normalizeStatus(raw: unknown): CustomerStatus {
  if (raw === 'inactive' || raw === 'blocked') return raw
  return 'active'
}

export function parseCustomerId(raw: string | number): number | null {
  const s = String(raw ?? '').trim()
  const m = s.match(/^(?:user[_-]?)?(\d+)$/i)
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

function mapRow(row: Record<string, any>, addresses: CustomerListRow['addresses'] = []): CustomerListRow {
  return {
    id: String(row.id),
    firstName: String(row.first_name || row.firstName || ''),
    lastName: String(row.last_name || row.lastName || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    status: normalizeStatus(row.status),
    registeredAt: iso(row.created_at || row.registeredAt),
    lastActivityAt: iso(row.last_activity_at || row.lastActivityAt || row.updated_at || row.created_at),
    orderCount: num(row.order_count),
    completedOrders: num(row.completed_orders),
    cancelledOrders: num(row.cancelled_orders),
    returnedOrders: num(row.returned_orders),
    totalSpent: num(row.total_spent),
    refundTotal: num(row.refund_total),
    reviewCount: num(row.review_count),
    questionCount: num(row.question_count),
    wishlistCount: num(row.wishlist_count),
    addresses,
  }
}

/** Aggregated seller-order stats per buyer user */
const ORDER_STATS_SQL = `
  select
    o.user_id,
    count(so.id)::int as order_count,
    count(so.id) filter (where so.status = 'delivered')::int as completed_orders,
    count(so.id) filter (where so.status = 'cancelled')::int as cancelled_orders,
    count(so.id) filter (where so.status = 'returned')::int as returned_orders,
    coalesce(sum(so.total) filter (where so.status <> 'cancelled'), 0)::bigint as total_spent,
    coalesce(sum(so.refunded_amount), 0)::bigint as refund_total
  from orders o
  inner join seller_orders so on so.buyer_order_id = o.id
  group by o.user_id
`

function applyFilters(query: any, filters: CustomersQuery) {
  let q = query.where('u.role', 'customer')

  if (filters.status && filters.status !== 'all') {
    q = q.where('u.status', filters.status)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder: any) => {
      builder
        .whereILike('u.phone', like)
        .orWhereRaw('u.id::text ilike ?', [like])
        .orWhereRaw(`concat_ws(' ', p.first_name, p.last_name) ilike ?`, [like])
        .orWhereILike('p.first_name', like)
        .orWhereILike('p.last_name', like)
        .orWhereILike('p.email', like)
    })
  }

  if (filters.hasOrders === true) {
    q = q.whereRaw('coalesce(ord_stats.order_count, 0) > 0')
  }
  if (filters.spendMin != null && Number.isFinite(filters.spendMin)) {
    q = q.whereRaw('coalesce(ord_stats.total_spent, 0) >= ?', [Math.round(filters.spendMin)])
  }
  if (filters.spendMax != null && Number.isFinite(filters.spendMax)) {
    q = q.whereRaw('coalesce(ord_stats.total_spent, 0) <= ?', [Math.round(filters.spendMax)])
  }

  return q
}

function applySort(query: any, sort?: string) {
  switch (sort) {
    case 'oldest':
      return query.orderBy('u.created_at', 'asc').orderBy('u.id', 'asc')
    case 'spending_desc':
      return query.orderByRaw('coalesce(ord_stats.total_spent, 0) desc').orderBy('u.id', 'desc')
    case 'spending_asc':
      return query.orderByRaw('coalesce(ord_stats.total_spent, 0) asc').orderBy('u.id', 'desc')
    case 'name':
      return query
        .orderByRaw(`coalesce(p.first_name, '') asc`)
        .orderByRaw(`coalesce(p.last_name, '') asc`)
        .orderBy('u.id', 'asc')
    case 'newest':
    default:
      return query.orderBy('u.created_at', 'desc').orderBy('u.id', 'desc')
  }
}

function baseFrom() {
  return db
    .from('users as u')
    .leftJoin('profiles as p', 'p.user_id', 'u.id')
    .joinRaw(`left join (${ORDER_STATS_SQL}) as ord_stats on ord_stats.user_id = u.id`)
}

function baseSelect() {
  return baseFrom()
    .joinRaw(`left join (
        select user_id, count(*)::int as review_count
        from product_reviews
        where user_id is not null
        group by user_id
      ) as rev_stats on rev_stats.user_id = u.id`)
    .joinRaw(`left join (
        select user_id, count(*)::int as question_count
        from product_questions
        where user_id is not null
        group by user_id
      ) as q_stats on q_stats.user_id = u.id`)
    .joinRaw(`left join (
        select user_id, count(*)::int as wishlist_count
        from wishlist_items
        where user_id is not null
        group by user_id
      ) as wish_stats on wish_stats.user_id = u.id`)
    .joinRaw(`left join (
        select user_id, max(occurred_at) as last_activity_at
        from user_activities
        group by user_id
      ) as act_stats on act_stats.user_id = u.id`)
    .select(
      'u.id',
      'u.phone',
      'u.status',
      'u.created_at',
      'u.updated_at',
      'p.first_name',
      'p.last_name',
      'p.email',
      db.raw('coalesce(ord_stats.order_count, 0) as order_count'),
      db.raw('coalesce(ord_stats.completed_orders, 0) as completed_orders'),
      db.raw('coalesce(ord_stats.cancelled_orders, 0) as cancelled_orders'),
      db.raw('coalesce(ord_stats.returned_orders, 0) as returned_orders'),
      db.raw('coalesce(ord_stats.total_spent, 0) as total_spent'),
      db.raw('coalesce(ord_stats.refund_total, 0) as refund_total'),
      db.raw('coalesce(rev_stats.review_count, 0) as review_count'),
      db.raw('coalesce(q_stats.question_count, 0) as question_count'),
      db.raw('coalesce(wish_stats.wishlist_count, 0) as wishlist_count'),
      db.raw(
        'coalesce(act_stats.last_activity_at, u.updated_at, u.created_at) as last_activity_at'
      )
    )
}

async function countCustomers(filters: CustomersQuery) {
  const row = await applyFilters(baseFrom(), filters)
    .select(db.raw('count(distinct u.id)::int as total'))
    .first()
  return Number((row as any)?.total ?? 0)
}

async function statusCounts(filters: CustomersQuery) {
  const [all, active, inactive, blocked] = await Promise.all([
    countCustomers({ ...filters, status: undefined }),
    countCustomers({ ...filters, status: 'active' }),
    countCustomers({ ...filters, status: 'inactive' }),
    countCustomers({ ...filters, status: 'blocked' }),
  ])
  return { all, active, inactive, blocked }
}

export async function querySellerCustomers(filters: CustomersQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const [total, statusCountsResult] = await Promise.all([
    countCustomers(filters),
    statusCounts(filters),
  ])

  const listQuery = applySort(applyFilters(baseSelect(), filters), filters.sort)
  const rows = wantAll
    ? await listQuery.limit(pageSize)
    : await listQuery.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: (rows as any[]).map((row) => mapRow(row)),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? (rows as any[]).length : pageSize,
    statusCounts: statusCountsResult,
  }
}

export async function getSellerCustomerDetail(userId: number) {
  const row = await applyFilters(baseSelect(), {}).where('u.id', userId).first()
  if (!row) return null

  const addresses = await db
    .from('addresses')
    .where('user_id', userId)
    .orderBy('is_default', 'desc')
    .orderBy('created_at', 'desc')

  const orders = await db
    .from('seller_orders as so')
    .innerJoin('orders as o', 'o.id', 'so.buyer_order_id')
    .where('o.user_id', userId)
    .select(
      'so.id',
      'so.date',
      'so.date_key',
      'so.status',
      'so.total',
      'so.shipping_method',
      'so.payment_method',
      'so.customer_name',
      'so.customer_phone'
    )
    .orderBy('so.date_key', 'desc')
    .orderBy('so.id', 'desc')
    .limit(20)

  return {
    ...mapRow(
      row as any,
      (addresses as any[]).map((a) => ({
        id: String(a.id),
        title: String(a.title || ''),
        recipient: String(a.full_name || a.fullName || ''),
        phone: String(a.phone || ''),
        province: String(a.province || ''),
        city: String(a.city || ''),
        address: String(a.address || ''),
        postalCode: String(a.postal_code || a.postalCode || ''),
        isDefault: Boolean(a.is_default ?? a.isDefault),
      }))
    ),
    recentOrders: (orders as any[]).map((o) => ({
      id: String(o.id),
      date: String(o.date || ''),
      dateKey: String(o.date_key || ''),
      status: String(o.status || ''),
      total: num(o.total),
      shippingMethod: String(o.shipping_method || ''),
      paymentMethod: String(o.payment_method || ''),
      customerName: String(o.customer_name || ''),
      customerPhone: String(o.customer_phone || ''),
    })),
  }
}
