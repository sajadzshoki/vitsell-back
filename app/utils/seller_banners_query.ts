import Banner from '#models/banner'
import type { BannersQuery } from '#validators/banners_query'
import {
  applyActiveScheduleStatus,
  countActiveScheduleBuckets,
  pageWindow,
} from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type BannerQuery = ModelQueryBuilderContract<typeof Banner, Banner>

function applyFilters(query: BannerQuery, filters: BannersQuery, includeStatus = true) {
  let q = query
  if (includeStatus) {
    q = applyActiveScheduleStatus(q, filters.status)
  }
  if (filters.placement && filters.placement !== 'all') {
    q = q.where('placement', filters.placement)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('title', like)
        .orWhereILike('internal_name', like)
        .orWhereILike('link', like)
        .orWhereILike('category_id', like)
    })
  }
  return q
}

export async function querySellerBanners(filters: BannersQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(Banner.query(), filters)
    .orderBy('priority', 'asc')
    .orderBy('sort_order', 'asc')

  const countRow = await applyFilters(Banner.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countActiveScheduleBuckets(() =>
    applyFilters(Banner.query(), filters, false)
  )

  return {
    items: items.map((b) => b.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts,
  }
}
