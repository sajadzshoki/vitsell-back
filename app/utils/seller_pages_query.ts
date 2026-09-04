import StaticPage from '#models/static_page'
import type { PagesQuery } from '#validators/pages_query'
import { pageWindow } from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type PageQ = ModelQueryBuilderContract<typeof StaticPage, StaticPage>

function applyFilters(query: PageQ, filters: PagesQuery, includeStatus = true) {
  let q = query
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('title', like)
        .orWhereILike('path', like)
        .orWhereILike('subtitle', like)
    })
  }
  return q
}

async function countByStatus(base: () => PageQ) {
  const statuses = ['draft', 'published', 'archived'] as const
  const counts: Record<string, number> = {
    all: 0,
    draft: 0,
    published: 0,
    archived: 0,
  }
  const allRow = await base().count('* as total').first()
  counts.all = Number((allRow as any)?.$extras?.total ?? (allRow as any)?.total ?? 0)
  for (const status of statuses) {
    const row = await base().where('status', status).count('* as total').first()
    counts[status] = Number((row as any)?.$extras?.total ?? (row as any)?.total ?? 0)
  }
  return counts
}

export async function querySellerPages(filters: PagesQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(StaticPage.query(), filters).orderBy('updated_at', 'desc')

  const countRow = await applyFilters(StaticPage.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countByStatus(() => applyFilters(StaticPage.query(), filters, false))

  return {
    items: items.map((p) => p.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts,
  }
}
