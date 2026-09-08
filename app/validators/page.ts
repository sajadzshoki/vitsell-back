import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

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

const sectionSchema = vine.any()

const pageFields = {
  path: vine.string().trim().minLength(1),
  title: vine.string().trim().minLength(1).maxLength(200),
  subtitle: vine.string().trim().optional(),
  icon: vine.string().trim().optional(),
  sections: vine.array(sectionSchema).optional(),
  sourceId: vine.string().trim().nullable().optional(),
  status: vine.enum(['draft', 'published', 'archived'] as const).optional(),
  seo: seoSchema.clone().optional(),
  publishedAt: vine.string().trim().nullable().optional(),
  template: vine.string().trim().optional(),
}

export const storePageValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
    ...pageFields,
  })
)

export const updatePageValidator = vine.compile(vine.object(pageFields))

export const pageStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['draft', 'published', 'archived'] as const),
  })
)
