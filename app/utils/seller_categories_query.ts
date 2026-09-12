import Category from '#models/category'
import type { CategoriesQuery } from '#validators/categories'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type CategoryQuery = ModelQueryBuilderContract<typeof Category, Category>

function applyCategoryFilters(query: CategoryQuery, filters: CategoriesQuery, options?: { includeStatus?: boolean }) {
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
        .whereILike('name', like)
        .orWhereILike('id', like)
        .orWhereILike('icon', like)
        .orWhereIn(
          'parent_id',
          Category.query().select('id').whereILike('name', like)
        )
    })
  }

  const parentRaw = filters.parentId?.trim()
  if (parentRaw && parentRaw !== 'all') {
    if (parentRaw === '__root__') {
      q = q.whereNull('parent_id')
    }
    else {
      q = q.where('parent_id', parentRaw)
    }
  }

  return q
}

/**
 * Count products that still have a seller listing.
 * Soft-deleted listings leave orphan `products` rows (inStock=false) that must not inflate admin counts.
 */
async function productCountMap(categoryIds: string[]) {
  const map = new Map<string, number>()
  if (!categoryIds.length) return map

  const rows = await db
    .from('products')
    .innerJoin('seller_listings', 'seller_listings.product_id', 'products.id')
    .select('products.category')
    .count('* as total')
    .whereIn('products.category', categoryIds)
    .groupBy('products.category')

  for (const row of rows as Array<{ category: string; total: string | number }>) {
    map.set(row.category, Number(row.total) || 0)
  }
  return map
}

async function childCountMap(categoryIds: string[]) {
  const map = new Map<string, number>()
  if (!categoryIds.length) return map

  const rows = await db
    .from('categories')
    .select('parent_id')
    .count('* as total')
    .whereIn('parent_id', categoryIds)
    .groupBy('parent_id')

  for (const row of rows as Array<{ parent_id: string; total: string | number }>) {
    if (row.parent_id) map.set(row.parent_id, Number(row.total) || 0)
  }
  return map
}

async function statusCounts(filters: CategoriesQuery) {
  const base = () => applyCategoryFilters(Category.query(), filters, { includeStatus: false })

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

export async function querySellerCategories(filters: CategoriesQuery) {
  const categories = await applyCategoryFilters(Category.query(), filters)
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc')

  const ids = categories.map((c) => c.id)
  const [products, children, counts, parentRows] = await Promise.all([
    productCountMap(ids),
    childCountMap(ids),
    statusCounts(filters),
    Category.query().select('id', 'name').orderBy('sort_order', 'asc').orderBy('name', 'asc'),
  ])

  const parentNameById = new Map(parentRows.map((r) => [r.id, r.name]))

  return {
    items: categories.map((c) => ({
      ...c.toAdminJSON(),
      productCount: products.get(c.id) || 0,
      childCount: children.get(c.id) || 0,
      parentName: c.parentId ? parentNameById.get(c.parentId) ?? c.parentId : null,
    })),
    total: categories.length,
    statusCounts: counts,
    parentOptions: parentRows.map((r) => ({ id: r.id, name: r.name })),
  }
}
