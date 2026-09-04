import vine from '@vinejs/vine'

const slugRule = vine.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const seoSchema = vine
  .object({
    metaTitle: vine.string().trim().optional(),
    metaDescription: vine.string().trim().optional(),
    metaKeywords: vine.string().trim().optional(),
    canonicalUrl: vine.string().trim().optional(),
    robots: vine.string().trim().optional(),
    ogTitle: vine.string().trim().optional(),
    ogDescription: vine.string().trim().optional(),
    ogImage: vine.string().trim().optional(),
    twitterTitle: vine.string().trim().optional(),
    twitterDescription: vine.string().trim().optional(),
    twitterImage: vine.string().trim().optional(),
  })
  .nullable()
  .optional()

const brandFields = {
  name: vine.string().trim().minLength(1),
  logo: vine.string().trim().nullable().optional(),
  description: vine.string().trim().optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  sortOrder: vine.number().min(0).optional(),
  seo: seoSchema,
}

export const storeBrandValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    slug: slugRule.clone(),
    ...brandFields,
  })
)

export const updateBrandValidator = vine.compile(
  vine.object({
    ...brandFields,
  })
)

export const brandStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive'] as const),
  })
)

export const brandsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type BrandsQuery = Awaited<ReturnType<(typeof brandsQueryValidator)['validate']>>
