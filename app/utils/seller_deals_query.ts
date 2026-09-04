import AmazingDeal from '#models/amazing_deal'
import type { DealsQuery } from '#validators/deals_query'
import {
  applyActiveScheduleStatus,
  countActiveScheduleBuckets,
  pageWindow,
} from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type DealQuery = ModelQueryBuilderContract<typeof AmazingDeal, AmazingDeal>

function applyFilters(query: DealQuery, filters: DealsQuery, includeStatus = true) {
  let q = query
  if (includeStatus) {
    q = applyActiveScheduleStatus(q, filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder.whereILike('id', like).orWhereILike('product_id', like)
    })
  }
  return q
}

export async function querySellerDeals(filters: DealsQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(AmazingDeal.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(AmazingDeal.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countActiveScheduleBuckets(() =>
    applyFilters(AmazingDeal.query(), filters, false)
  )

  return {
    items: items.map((d) => d.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts,
  }
}
