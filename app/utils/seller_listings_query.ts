import SellerListing from '#models/seller_listing'
import type { ListingsQuery } from '#validators/listings'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type ListingQuery = ModelQueryBuilderContract<typeof SellerListing, SellerListing>

const DEFAULT_LOW_STOCK = 5

function parseDayStart(value?: string | null) {
  if (!value?.trim()) return null
  const raw = value.trim()
  const iso = DateTime.fromISO(raw, { setZone: true })
  if (iso.isValid) return iso.startOf('day').toUTC()
  const ymd = DateTime.fromFormat(raw.slice(0, 10), 'yyyy-MM-dd', { zone: 'Asia/Tehran' })
  if (ymd.isValid) return ymd.startOf('day').toUTC()
  return null
}

function parseDayEnd(value?: string | null) {
  if (!value?.trim()) return null
  const raw = value.trim()
  const iso = DateTime.fromISO(raw, { setZone: true })
  if (iso.isValid) return iso.endOf('day').toUTC()
  const ymd = DateTime.fromFormat(raw.slice(0, 10), 'yyyy-MM-dd', { zone: 'Asia/Tehran' })
  if (ymd.isValid) return ymd.endOf('day').toUTC()
  return null
}

function applyProductJoin(query: ListingQuery) {
  return query.join('products', 'products.id', 'seller_listings.product_id')
}

/** Filters that apply to both the list and statusCounts (everything except status). */
export function applyListingFilters(
  query: ListingQuery,
  filters: ListingsQuery,
  options?: { includeStatus?: boolean }
) {
  let q = applyProductJoin(query).select('seller_listings.*')

  const includeStatus = options?.includeStatus !== false
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('seller_listings.status', filters.status)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('products.title', like)
        .orWhereILike('products.brand', like)
        .orWhereILike('products.id', like)
        .orWhereILike('products.short_name', like)
        .orWhereILike('products.sku', like)
    })
  }

  if (filters.category?.trim()) {
    q = q.where('products.category', filters.category.trim())
  }
  if (filters.brand?.trim()) {
    q = q.where('products.brand', filters.brand.trim())
  }

  if (filters.stock && filters.stock !== 'all') {
    const thresholdSql =
      'COALESCE(products.low_stock_threshold, ' + DEFAULT_LOW_STOCK + ')'
    if (filters.stock === 'out_of_stock') {
      q = q.where((builder) => {
        builder
          .where('seller_listings.status', 'out_of_stock')
          .orWhere('seller_listings.stock', '<=', 0)
      })
    } else if (filters.stock === 'low_stock') {
      q = q
        .where('seller_listings.status', '!=', 'out_of_stock')
        .where('seller_listings.stock', '>', 0)
        .whereRaw(`seller_listings.stock <= ${thresholdSql}`)
    } else if (filters.stock === 'in_stock') {
      q = q
        .where('seller_listings.status', '!=', 'out_of_stock')
        .whereRaw(`seller_listings.stock > ${thresholdSql}`)
    }
  }

  if (filters.priceMin != null && filters.priceMin > 0) {
    q = q.where('products.price', '>=', filters.priceMin)
  }
  if (filters.priceMax != null && filters.priceMax > 0) {
    q = q.where('products.price', '<=', filters.priceMax)
  }

  const from = parseDayStart(filters.dateFrom)
  const to = parseDayEnd(filters.dateTo)
  if (from) q = q.where('seller_listings.created_at', '>=', from.toSQL()!)
  if (to) q = q.where('seller_listings.created_at', '<=', to.toSQL()!)

  if (filters.hasDiscount === true) {
    q = q
      .whereNotNull('products.old_price')
      .whereRaw('products.old_price > products.price')
  }
  if (filters.hasVariants === true) {
    q = q.where('products.has_variants', true)
  }
  if (filters.featured === true) {
    q = q.where('products.featured', true)
  }
  if (filters.published === true) {
    q = q.where('products.published', true)
  }

  return q
}

export function applyListingSort(query: ListingQuery, sort?: string) {
  switch (sort) {
    case 'price_asc':
      return query.orderBy('products.price', 'asc')
    case 'price_desc':
      return query.orderBy('products.price', 'desc')
    case 'stock_asc':
      return query.orderBy('seller_listings.stock', 'asc')
    case 'title':
      return query.orderBy('products.title', 'asc')
    case 'newest':
    default:
      return query.orderBy('seller_listings.updated_at', 'desc')
  }
}

export async function listingStatusCounts(filters: ListingsQuery) {
  const counts: Record<string, number> = {
    all: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    out_of_stock: 0,
  }

  const statuses = ['active', 'pending', 'inactive', 'out_of_stock'] as const
  await Promise.all(
    statuses.map(async (status) => {
      const row = await applyListingFilters(SellerListing.query(), { ...filters, status })
        .clearOrder()
        .clearSelect()
        .count('* as total')
        .first()
      const total = Number((row as any)?.$extras?.total ?? 0)
      counts[status] = total
      counts.all += total
    })
  )

  return counts
}

export async function querySellerListings(filters: ListingsQuery) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? (filters.all ? 500 : 10)))
  const wantAll = filters.all === true

  let query = applyListingFilters(SellerListing.query(), filters)
  query = applyListingSort(query, filters.sort ?? 'newest')

  const countQuery = applyListingFilters(SellerListing.query(), filters)
  const totalRow = await countQuery.clone().clearOrder().clearSelect().count('* as total').first()
  const total = Number((totalRow as any)?.$extras?.total ?? 0)

  if (!wantAll) {
    query = query.offset((page - 1) * pageSize).limit(pageSize)
  } else {
    query = query.limit(pageSize)
  }

  const listings = await query.preload('product')
  const statusCounts = await listingStatusCounts(filters)

  return {
    items: listings.map((l) => ({
      ...l.toJSON(),
      ...(l.product
        ? {
            product: {
              ...l.product.toCatalogJSON(),
              featured: Boolean((l.product as any).featured),
              published: (l.product as any).published !== false,
              hasVariants: Boolean((l.product as any).hasVariants),
              sku: (l.product as any).sku ?? null,
              lowStockThreshold:
                Number((l.product as any).lowStockThreshold) || DEFAULT_LOW_STOCK,
            },
          }
        : {}),
      createdAt: l.createdAt?.toISO() ?? null,
      updatedAt: l.updatedAt?.toISO() ?? null,
    })),
    total: wantAll ? listings.length : total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? listings.length : pageSize,
    statusCounts,
  }
}

/** Lightweight brand list for admin filter dropdowns */
export async function listingBrandOptions() {
  const rows = await db
    .from('seller_listings')
    .join('products', 'products.id', 'seller_listings.product_id')
    .distinct('products.brand')
    .whereNotNull('products.brand')
    .where('products.brand', '!=', '')
    .orderBy('products.brand', 'asc')
  return rows.map((r: { brand: string }) => r.brand).filter(Boolean)
}
