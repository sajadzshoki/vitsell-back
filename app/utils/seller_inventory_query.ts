import SellerListing from '#models/seller_listing'
import type { InventoryQuery } from '#validators/inventory'
import { resolveDefaultWarehouseId } from '#utils/seller_warehouses_query'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import db from '@adonisjs/lucid/services/db'

type ListingQuery = ModelQueryBuilderContract<typeof SellerListing, SellerListing>

const DEFAULT_LOW_STOCK = 5
const THRESHOLD_SQL = `COALESCE(products.low_stock_threshold, ${DEFAULT_LOW_STOCK})`

function applyListFilters(
  query: ListingQuery,
  filters: InventoryQuery,
  options?: { includeStock?: boolean },
) {
  let q = query
    .join('products', 'products.id', 'seller_listings.product_id')
    .select('seller_listings.*')

  const includeStock = options?.includeStock !== false

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('products.title', like)
        .orWhereILike('products.id', like)
        .orWhereILike('products.sku', like)
        .orWhereILike('products.brand', like)
        .orWhereILike('products.short_name', like)
    })
  }

  if (filters.category?.trim() && filters.category !== 'all') {
    q = q.where('products.category', filters.category.trim())
  }
  if (filters.brand?.trim() && filters.brand !== 'all') {
    q = q.where('products.brand', filters.brand.trim())
  }
  if (filters.warehouseId?.trim() && filters.warehouseId !== 'all') {
    q = q.where('seller_listings.warehouse_id', filters.warehouseId.trim())
  }

  if (includeStock && filters.status && filters.status !== 'all') {
    if (filters.status === 'out_of_stock') {
      q = q.where((builder) => {
        builder
          .where('seller_listings.status', 'out_of_stock')
          .orWhere('seller_listings.stock', '<=', 0)
      })
    }
    else if (filters.status === 'low_stock') {
      q = q
        .where('seller_listings.stock', '>', 0)
        .whereRaw(`seller_listings.stock <= ${THRESHOLD_SQL}`)
        .where('seller_listings.status', '!=', 'out_of_stock')
    }
    else if (filters.status === 'in_stock') {
      q = q
        .where('seller_listings.stock', '>', 0)
        .whereRaw(`seller_listings.stock > ${THRESHOLD_SQL}`)
    }
  }

  return q
}

/** Knex count query — avoids Lucid select(*) + count(*) PG 42803. */
function inventoryCountQuery(filters: InventoryQuery, options?: { includeStock?: boolean }) {
  let q = db
    .from('seller_listings')
    .join('products', 'products.id', 'seller_listings.product_id')
    .count('* as total')

  const includeStock = options?.includeStock !== false

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('products.title', like)
        .orWhereILike('products.id', like)
        .orWhereILike('products.sku', like)
        .orWhereILike('products.brand', like)
        .orWhereILike('products.short_name', like)
    })
  }

  if (filters.category?.trim() && filters.category !== 'all') {
    q = q.where('products.category', filters.category.trim())
  }
  if (filters.brand?.trim() && filters.brand !== 'all') {
    q = q.where('products.brand', filters.brand.trim())
  }
  if (filters.warehouseId?.trim() && filters.warehouseId !== 'all') {
    q = q.where('seller_listings.warehouse_id', filters.warehouseId.trim())
  }

  if (includeStock && filters.status && filters.status !== 'all') {
    if (filters.status === 'out_of_stock') {
      q = q.where((builder) => {
        builder
          .where('seller_listings.status', 'out_of_stock')
          .orWhere('seller_listings.stock', '<=', 0)
      })
    }
    else if (filters.status === 'low_stock') {
      q = q
        .where('seller_listings.stock', '>', 0)
        .whereRaw(`seller_listings.stock <= ${THRESHOLD_SQL}`)
        .where('seller_listings.status', '!=', 'out_of_stock')
    }
    else if (filters.status === 'in_stock') {
      q = q
        .where('seller_listings.stock', '>', 0)
        .whereRaw(`seller_listings.stock > ${THRESHOLD_SQL}`)
    }
  }

  return q
}

function rowStatus(stock: number, threshold: number, listingStatus: string) {
  if (listingStatus === 'out_of_stock' || stock <= 0) return 'out_of_stock' as const
  if (stock <= threshold) return 'low_stock' as const
  return 'in_stock' as const
}

async function countRows(filters: InventoryQuery, options?: { includeStock?: boolean }) {
  const row = await inventoryCountQuery(filters, options).first()
  return Number((row as any)?.total ?? 0)
}

async function statusCounts(filters: InventoryQuery) {
  const base = inventoryCountQuery(filters, { includeStock: false })
  const [allRow, inStockRow, lowRow, outRow] = await Promise.all([
    base.clone().first(),
    base
      .clone()
      .where('seller_listings.stock', '>', 0)
      .whereRaw(`seller_listings.stock > ${THRESHOLD_SQL}`)
      .first(),
    base
      .clone()
      .where('seller_listings.stock', '>', 0)
      .whereRaw(`seller_listings.stock <= ${THRESHOLD_SQL}`)
      .where('seller_listings.status', '!=', 'out_of_stock')
      .first(),
    base
      .clone()
      .where((builder) => {
        builder
          .where('seller_listings.status', 'out_of_stock')
          .orWhere('seller_listings.stock', '<=', 0)
      })
      .first(),
  ])
  const num = (row: any) => Number(row?.total ?? 0)
  return {
    all: num(allRow),
    in_stock: num(inStockRow),
    low_stock: num(lowRow),
    out_of_stock: num(outRow),
  }
}

export async function querySellerInventory(filters: InventoryQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 15)))
  const defaultWh = await resolveDefaultWarehouseId()

  const [total, statusCountsResult, listings] = await Promise.all([
    countRows(filters),
    statusCounts(filters),
    (async () => {
      const base = applyListFilters(SellerListing.query(), filters).orderBy('products.title', 'asc')
      return wantAll
        ? await base.preload('product').limit(pageSize)
        : await base.preload('product').offset((page - 1) * pageSize).limit(pageSize)
    })(),
  ])

  const items = listings.map((listing) => {
    const product = listing.product
    const stock = Number(listing.stock) || 0
    const reserved = Number((listing as any).reserved) || 0
    const threshold = Number((product as any)?.lowStockThreshold) || DEFAULT_LOW_STOCK
    const available = Math.max(0, stock - reserved)
    const warehouseId = (listing as any).warehouseId || defaultWh
    return {
      id: listing.productId,
      productId: listing.productId,
      productTitle: product?.title || listing.productId,
      sku: (product as any)?.sku || listing.productId,
      variantId: null as string | null,
      variantLabel: null as string | null,
      warehouseId,
      stock,
      reserved,
      available,
      lowStockThreshold: threshold,
      status: rowStatus(stock, threshold, listing.status),
      category: product?.category || '',
      categoryLabel: product?.categoryLabel || '',
      brand: product?.brand || '',
    }
  })

  let facetQ = db
    .from('seller_listings')
    .join('products', 'products.id', 'seller_listings.product_id')
    .select('products.category', 'products.category_label', 'products.brand')
    .groupBy('products.category', 'products.category_label', 'products.brand')

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    facetQ = facetQ.where((builder) => {
      builder
        .whereILike('products.title', like)
        .orWhereILike('products.id', like)
        .orWhereILike('products.sku', like)
        .orWhereILike('products.brand', like)
        .orWhereILike('products.short_name', like)
    })
  }
  if (filters.warehouseId?.trim() && filters.warehouseId !== 'all') {
    facetQ = facetQ.where('seller_listings.warehouse_id', filters.warehouseId.trim())
  }

  const facetRows = await facetQ
  const categoryMap = new Map<string, string>()
  const brandSet = new Set<string>()
  for (const row of facetRows as any[]) {
    const category = String(row.category || '').trim()
    const categoryLabel = String(row.category_label || category).trim()
    const brand = String(row.brand || '').trim()
    if (category) categoryMap.set(category, categoryLabel || category)
    if (brand) brandSet.add(brand)
  }

  return {
    items,
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: statusCountsResult,
    defaultWarehouseId: defaultWh,
    categoryOptions: [...categoryMap.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fa')),
    brandOptions: [...brandSet]
      .sort((a, b) => a.localeCompare(b, 'fa'))
      .map((value) => ({ value, label: value })),
  }
}
