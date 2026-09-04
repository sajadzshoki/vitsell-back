import SellerReview from '#models/seller_review'
import type { ReviewsQuery } from '#validators/reviews'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type ReviewModeration = 'pending' | 'approved' | 'rejected' | 'hidden'

type ReviewQuery = ModelQueryBuilderContract<typeof SellerReview, SellerReview>

function applyFilters(query: ReviewQuery, filters: ReviewsQuery, options?: { includeStatus?: boolean }) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const status = filters.status

  if (includeStatus && status && status !== 'all') {
    if (status === 'unanswered') {
      q = q.where((builder) => {
        builder.whereNull('reply').orWhere('reply', '')
      })
    } else if (status === 'answered') {
      q = q.whereNotNull('reply').where('reply', '<>', '')
    } else {
      q = q.where('moderation', status)
    }
  }

  if (filters.rating != null && Number.isFinite(filters.rating)) {
    q = q.where('rating', Math.round(filters.rating))
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('name', like)
        .orWhereILike('text', like)
        .orWhereILike('product_id', like)
        .orWhereILike('reply', like)
        .orWhereExists((sub) => {
          sub
            .from('products as p')
            .whereRaw('p.id = seller_reviews.product_id')
            .whereILike('p.title', like)
        })
    })
  }

  return q
}

async function statusCounts(filters: ReviewsQuery) {
  const base = () => applyFilters(SellerReview.query(), filters, { includeStatus: false })
  const [
    allRow,
    unansweredRow,
    answeredRow,
    pendingRow,
    approvedRow,
    rejectedRow,
    hiddenRow,
  ] = await Promise.all([
    base().count('* as total').first(),
    base()
      .where((builder) => {
        builder.whereNull('reply').orWhere('reply', '')
      })
      .count('* as total')
      .first(),
    base().whereNotNull('reply').where('reply', '<>', '').count('* as total').first(),
    base().where('moderation', 'pending').count('* as total').first(),
    base().where('moderation', 'approved').count('* as total').first(),
    base().where('moderation', 'rejected').count('* as total').first(),
    base().where('moderation', 'hidden').count('* as total').first(),
  ])

  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    unanswered: num(unansweredRow),
    answered: num(answeredRow),
    pending: num(pendingRow),
    approved: num(approvedRow),
    rejected: num(rejectedRow),
    hidden: num(hiddenRow),
  }
}

export async function querySellerReviews(filters: ReviewsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(SellerReview.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(SellerReview.query(), filters).count('* as total').first()
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
