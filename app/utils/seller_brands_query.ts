import Brand from '#models/brand'
import type { BrandsQuery } from '#validators/brand'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type BrandQuery = ModelQueryBuilderContract<typeof Brand, Brand>

function applyBrandFilters(query: BrandQuery, filters: BrandsQuery, options?: { includeStatus?: boolean }) {
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
        .orWhereILike('slug', like)
        .orWhereILike('id', like)
        .orWhereILike('description', like)
    })
  }

  return q
}

async function productCountByName(names: string[]) {
  const map = new Map<string, number>()
  if (!names.length) return map

  const rows = await db
    .from('products')
    .select('brand')
    .count('* as total')
    .whereIn('brand', names)
    .groupBy('brand')

  for (const row of rows as Array<{ brand: string; total: string | number }>) {
    map.set(row.brand, Number(row.total) || 0)
  }
  return map
}

async function statusCounts(filters: BrandsQuery) {
  const base = () => applyBrandFilters(Brand.query(), filters, { includeStatus: false })
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

export async function querySellerBrands(filters: BrandsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const base = applyBrandFilters(Brand.query(), filters).orderBy('sort_order', 'asc').orderBy('name', 'asc')

  const countRow = await applyBrandFilters(Brand.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const brands = wantAll
    ? await base.limit(pageSize)
    : await base.offset((page - 1) * pageSize).limit(pageSize)

  const counts = await productCountByName(brands.map((b) => b.name))
  const status = await statusCounts(filters)

  return {
    items: brands.map((b) =>
      b.toAdminJSON({ productCount: counts.get(b.name) || 0 })
    ),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? brands.length : pageSize,
    statusCounts: status,
  }
}
