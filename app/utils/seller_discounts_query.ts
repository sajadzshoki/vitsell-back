import StoreDiscount from '#models/store_discount'
import type { DiscountsQuery } from '#validators/discount'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type DiscountQuery = ModelQueryBuilderContract<typeof StoreDiscount, StoreDiscount>

function applyFilters(
  query: DiscountQuery,
  filters: DiscountsQuery,
  options?: { includeStatus?: boolean; includeType?: boolean }
) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const includeType = options?.includeType !== false

  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }

  if (includeType && filters.type && filters.type !== 'all') {
    q = q.where('type', filters.type)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('name', like)
        .orWhereILike('description', like)
    })
  }

  return q
}

async function statusCounts(filters: DiscountsQuery) {
  const base = () => applyFilters(StoreDiscount.query(), filters, { includeStatus: false })
  const [allRow, activeRow, inactiveRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('status', 'active').count('* as total').first(),
    base().where('status', 'inactive').count('* as total').first(),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    active: num(activeRow),
    inactive: num(inactiveRow),
  }
}

export async function querySellerDiscounts(filters: DiscountsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(StoreDiscount.query(), filters)
    .orderBy('priority', 'asc')
    .orderBy('created_at', 'desc')

  const countRow = await applyFilters(StoreDiscount.query(), filters).count('* as total').first()
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
