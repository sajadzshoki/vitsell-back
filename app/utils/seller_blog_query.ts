import BlogPost from '#models/blog_post'
import type { BlogQuery } from '#validators/blog_query'
import { pageWindow } from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type BlogQ = ModelQueryBuilderContract<typeof BlogPost, BlogPost>

function applyFilters(query: BlogQ, filters: BlogQuery, includeStatus = true) {
  let q = query
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  if (filters.category && filters.category !== 'all') {
    q = q.where('category', filters.category)
  }
  if (filters.author && filters.author !== 'all') {
    q = q.where('author', filters.author)
  }
  if (filters.featured === true) {
    q = q.where((builder) => {
      builder.where('featured', true).orWhere('popular', true)
    })
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('title', like)
        .orWhereILike('category', like)
        .orWhereILike('author', like)
        .orWhereILike('excerpt', like)
    })
  }
  return q
}

async function countByStatus(base: () => BlogQ) {
  const statuses = ['draft', 'scheduled', 'published', 'archived'] as const
  const counts: Record<string, number> = {
    all: 0,
    draft: 0,
    scheduled: 0,
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

export async function querySellerBlogPosts(filters: BlogQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(BlogPost.query(), filters).orderBy('created_at', 'desc')

  const countRow = await applyFilters(BlogPost.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countByStatus(() => applyFilters(BlogPost.query(), filters, false))

  const authorsRows = await applyFilters(BlogPost.query(), filters, false)
    .distinct('author')
    .select('author')
    .orderBy('author', 'asc')
  const categoriesRows = await applyFilters(BlogPost.query(), filters, false)
    .distinct('category')
    .select('category')
    .orderBy('category', 'asc')

  return {
    items: items.map((p) => p.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts,
    authors: authorsRows.map((r) => r.author).filter(Boolean),
    categories: categoriesRows.map((r) => r.category).filter(Boolean),
  }
}
