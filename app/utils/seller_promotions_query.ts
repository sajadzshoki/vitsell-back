import DiscountCode from '#models/discount_code'
import ContentPromo from '#models/content_promo'
import type { ContentPromosQuery, DiscountCodesQuery } from '#validators/promotions_query'
import {
  applyActiveScheduleStatus,
  countActiveScheduleBuckets,
  pageWindow,
} from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type CodeQuery = ModelQueryBuilderContract<typeof DiscountCode, DiscountCode>
type PromoQuery = ModelQueryBuilderContract<typeof ContentPromo, ContentPromo>

function applyCodeFilters(query: CodeQuery, filters: DiscountCodesQuery, includeStatus = true) {
  let q = query
  if (includeStatus) q = applyActiveScheduleStatus(q, filters.status)
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.whereILike('code', like)
  }
  return q
}

export async function querySellerDiscountCodes(filters: DiscountCodesQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyCodeFilters(DiscountCode.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyCodeFilters(DiscountCode.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((r) => r.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await countActiveScheduleBuckets(() =>
      applyCodeFilters(DiscountCode.query(), filters, false)
    ),
  }
}

function applyPromoFilters(query: PromoQuery, filters: ContentPromosQuery, includeStatus = true) {
  let q = query
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('active', filters.status === 'active')
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('title', like)
        .orWhereILike('eyebrow', like)
        .orWhereILike('subtitle', like)
    })
  }
  return q
}

export async function querySellerContentPromos(filters: ContentPromosQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyPromoFilters(ContentPromo.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyPromoFilters(ContentPromo.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const base = () => applyPromoFilters(ContentPromo.query(), filters, false)
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const [allRow, activeRow, inactiveRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('active', true).count('* as total').first(),
    base().where('active', false).count('* as total').first(),
  ])

  return {
    items: items.map((r) => r.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: {
      all: num(allRow),
      active: num(activeRow),
      inactive: num(inactiveRow),
    },
  }
}
