import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const manualStatuses = ['draft', 'paused', 'archived', 'active'] as const
const queryStatuses = [
  'all',
  'draft',
  'paused',
  'archived',
  'active',
  'scheduled',
  'expired',
] as const
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

const seoSchema = vine.object({
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

const campaignBody = {
  name: vine.string().trim().minLength(1).maxLength(120),
  description: vine.string().trim().maxLength(2000).optional(),
  manualStatus: vine.enum(manualStatuses).optional(),
  startsAt: vine.string().trim(),
  endsAt: vine.string().trim(),
  priority: vine.number().min(0).optional(),
  image: vine.string().trim().nullable().optional(),
  landingUrl: vine.string().trim().maxLength(500).optional(),
  slug: vine.string().trim().maxLength(80).optional(),
  seo: seoSchema.clone().optional(),
  targeting: targetingSchema.clone().optional(),
  discountIds: vine.array(vine.string().trim()).optional(),
  couponCodes: vine.array(vine.string().trim()).optional(),
  dealIds: vine.array(vine.string().trim()).optional(),
  bannerIds: vine.array(vine.string().trim()).optional(),
}

export const campaignsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(queryStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type CampaignsQuery = Awaited<ReturnType<(typeof campaignsQueryValidator)['validate']>>

export const storeCampaignValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
    ...campaignBody,
  })
)

export const updateCampaignValidator = vine.compile(
  vine.object({
    ...campaignBody,
  })
)

export const campaignStatusValidator = vine.compile(
  vine.object({
    manualStatus: vine.enum(manualStatuses),
  })
)

export const bulkCampaignStatusValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1),
    manualStatus: vine.enum(manualStatuses),
  })
)

export const bulkCampaignDeleteValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1),
  })
)
