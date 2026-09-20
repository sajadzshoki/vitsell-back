import vine from '@vinejs/vine'

const listingStatuses = ['active', 'pending', 'inactive', 'out_of_stock'] as const
const stockBuckets = ['in_stock', 'low_stock', 'out_of_stock'] as const
const sorts = ['newest', 'price_asc', 'price_desc', 'stock_asc', 'title'] as const

export const listingsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', ...listingStatuses] as const).optional(),
    category: vine.string().trim().optional(),
    brand: vine.string().trim().optional(),
    stock: vine.enum(['all', ...stockBuckets] as const).optional(),
    priceMin: vine.number().min(0).optional(),
    priceMax: vine.number().min(0).optional(),
    dateFrom: vine.string().trim().optional(),
    dateTo: vine.string().trim().optional(),
    hasDiscount: vine.boolean().optional(),
    hasVariants: vine.boolean().optional(),
    featured: vine.boolean().optional(),
    published: vine.boolean().optional(),
    sort: vine.enum(sorts).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(500).optional(),
    /** When true, skip pagination and return up to pageSize (default 500) */
    all: vine.boolean().optional(),
  })
)

export type ListingsQuery = Awaited<
  ReturnType<(typeof listingsQueryValidator)['validate']>
>

export const bulkListingsDeleteValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1).maxLength(500),
  })
)
