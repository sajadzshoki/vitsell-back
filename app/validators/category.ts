import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const emptyableString = () => vine.string().trim().nullable()

const subSchema = vine.object({
  name: vine.string().trim(),
  items: vine.array(vine.string().trim()).optional(),
  image: vine.string().trim().nullable().optional(),
})

const pageMetaSchema = vine
  .object({
    hero: vine.object({
      image: emptyableString(),
      eyebrow: emptyableString(),
      title: emptyableString(),
      subtitle: emptyableString(),
    }),
    seo: vine.object({
      heading: emptyableString(),
      paragraphs: vine.array(emptyableString()),
    }),
  })
  .nullable()
  .optional()

const suggestedSchema = vine
  .array(
    vine.object({
      id: vine.string().trim(),
      title: vine.string().trim(),
      image: emptyableString(),
      query: vine.string().trim(),
    })
  )
  .nullable()
  .optional()

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

const categoryFields = {
  name: vine.string().trim().minLength(1),
  icon: vine.string().trim().minLength(1),
  image: vine.string().trim().nullable().optional(),
  text: vine.string().trim().nullable().optional(),
  parentId: vine.string().trim().nullable().optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  sortOrder: vine.number().min(0).optional(),
  seo: seoSchema,
  subs: vine.array(subSchema).optional(),
  pageMeta: pageMetaSchema,
  suggested: suggestedSchema,
}

export const storeCategoryValidator = vine.compile(
  vine.object({
    id: idRule.clone(),
    ...categoryFields,
  })
)

export const updateCategoryValidator = vine.compile(vine.object(categoryFields))

export const bulkCategoryDeleteValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1).maxLength(500),
  })
)
