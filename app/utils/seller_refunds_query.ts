import SellerRefund from '#models/seller_refund'
import type { RefundsQuery } from '#validators/refunds'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type RefundQuery = ModelQueryBuilderContract<typeof SellerRefund, SellerRefund>

function applyFilters(query: RefundQuery, filters: RefundsQuery, options?: { includeStatus?: boolean }) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('order_id', like)
        .orWhereILike('customer_name', like)
        .orWhereILike('reason', like)
        .orWhereILike('transaction_id', like)
    })
  }
  return q
}

async function statusCounts(filters: RefundsQuery) {
  const base = () => applyFilters(SellerRefund.query(), filters, { includeStatus: false })
  const statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const
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

export async function querySellerRefunds(filters: RefundsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(SellerRefund.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(SellerRefund.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((row) => row.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}

export async function sumActiveRefundsForOrder(orderId: string, trx?: TransactionClientContract) {
  const query = trx ? SellerRefund.query({ client: trx }) : SellerRefund.query()
  const rows = await query
    .where('order_id', orderId)
    .whereIn('status', ['pending', 'processing', 'completed'])
  let completed = 0
  let reserved = 0
  for (const row of rows) {
    const amount = Number(row.amount) || 0
    if (row.status === 'completed') completed += amount
    else reserved += amount
  }
  return { completed, reserved, total: completed + reserved }
}
