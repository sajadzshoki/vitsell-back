import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const placements = [
  'homepage_hero',
  'homepage_promo_strip',
  'homepage_category',
  'homepage_product_section',
  'product_listing',
  'category_page',
  'category_page_hero',
  'category_page_promo',
  'product_detail',
  'sidebar',
  'footer_promo',
] as const

const bannerFields = {
  title: vine.string().trim().optional(),
  internalName: vine.string().trim().minLength(1),
  alt: vine.string().trim().optional(),
  image: vine.string().trim().minLength(1),
  imageMobile: vine.string().trim().nullable().optional(),
  link: vine.string().trim().optional(),
  linkType: vine
    .enum(['none', 'url', 'product', 'category', 'brand', 'campaign'] as const)
    .optional(),
  productId: vine.string().trim().nullable().optional(),
  brandId: vine.string().trim().nullable().optional(),
  campaignId: vine.string().trim().nullable().optional(),
  buttonText: vine.string().trim().nullable().optional(),
  type: vine.enum(['main', 'secondary'] as const).optional(),
  placement: vine.enum(placements).optional(),
  categoryId: vine.string().trim().nullable().optional(),
  active: vine.boolean().optional(),
  startsAt: vine.string().trim().nullable().optional(),
  endsAt: vine.string().trim().nullable().optional(),
  sortOrder: vine.number().optional(),
  priority: vine.number().optional(),
}

export const storeBannerValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
    ...bannerFields,
  })
)

export const updateBannerValidator = vine.compile(vine.object(bannerFields))

export const bannerActiveValidator = vine.compile(
  vine.object({
    active: vine.boolean(),
  })
)
