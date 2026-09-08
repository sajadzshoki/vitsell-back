import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const discountTypes = ['percent', 'fixed'] as const
const discountStatuses = ['all', 'active', 'inactive'] as const
const statusValues = ['active', 'inactive'] as const
const scopes = ['store', 'products', 'categories', 'brands'] as const

const targetingSchema = vine.object({
  scope: vine.enum(scopes).optional(),
  productIds: vine.array(vine.string().trim()).optional(),
  categoryIds: vine.array(vine.string().trim()).optional(),
  brandIds: vine.array(vine.string().trim()).optional(),
  excludeProductIds: vine.array(vine.string().trim()).optional(),
  excludeCategoryIds: vine.array(vine.string().trim()).optional(),
  excludeBrandIds: vine.array(vine.string().trim()).optional(),
})

const discountBody = {
  name: vine.string().trim().minLength(1).maxLength(120),
  description: vine.string().trim().maxLength(2000).optional(),
  type: vine.enum(discountTypes),
  value: vine.number(),
  minOrder: vine.number().min(0).optional(),
  maxDiscount: vine.number().min(0).nullable().optional(),
  startsAt: vine.string().trim().nullable().optional(),
  endsAt: vine.string().trim().nullable().optional(),
  status: vine.enum(statusValues).optional(),
  usageLimit: vine.number().min(0).nullable().optional(),
  perCustomerLimit: vine.number().min(0).nullable().optional(),
  priority: vine.number().min(0).optional(),
  targeting: targetingSchema.clone().optional(),
}

export const discountsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(discountStatuses).optional(),
    type: vine.enum(['all', ...discountTypes] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type DiscountsQuery = Awaited<ReturnType<(typeof discountsQueryValidator)['validate']>>

export const storeDiscountValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
    ...discountBody,
  })
)

export const updateDiscountValidator = vine.compile(
  vine.object({
    ...discountBody,
  })
)

export const discountStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(statusValues),
  })
)

export const bulkDiscountStatusValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1),
    status: vine.enum(statusValues),
  })
)

export const bulkDiscountDeleteValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1),
  })
)
