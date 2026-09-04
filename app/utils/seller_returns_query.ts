import SellerReturn from '#models/seller_return'
import type { ReturnsQuery } from '#validators/returns'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type ReturnQuery = ModelQueryBuilderContract<typeof SellerReturn, SellerReturn>

function applyFilters(query: ReturnQuery, filters: ReturnsQuery, options?: { includeStatus?: boolean }) {
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
        .orWhereILike('customer_id', like)
        .orWhereILike('reason', like)
    })
  }
  return q
}

async function statusCounts(filters: ReturnsQuery) {
  const base = () => applyFilters(SellerReturn.query(), filters, { includeStatus: false })
  const statuses = [
    'requested',
    'approved',
    'rejected',
    'received',
    'processing',
    'completed',
    'cancelled',
  ] as const
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

export async function querySellerReturns(filters: ReturnsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(SellerReturn.query(), filters).orderBy('requested_at', 'desc')
  const countRow = await applyFilters(SellerReturn.query(), filters).count('* as total').first()
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
