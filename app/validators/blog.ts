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

const blogFields = {
  title: vine.string().trim().minLength(1).maxLength(200),
  excerpt: vine.string().trim().minLength(1).maxLength(1000),
  date: vine.string().trim().optional(),
  category: vine.string().trim().minLength(1),
  readTime: vine.string().trim().optional(),
  author: vine.string().trim().minLength(1),
  image: vine.string().trim().minLength(1),
  imageAlt: vine.string().trim().optional(),
  relatedCategories: vine.array(vine.string().trim()).optional(),
  content: vine.array(vine.string().trim()).minLength(1),
  highlights: vine.array(vine.string().trim()).optional(),
  popular: vine.boolean().optional(),
  featured: vine.boolean().optional(),
  engagement: vine.number().min(0).optional(),
  active: vine.boolean().optional(),
  status: vine.enum(['draft', 'scheduled', 'published', 'archived'] as const).optional(),
  publishedAt: vine.string().trim().nullable().optional(),
  scheduledAt: vine.string().trim().nullable().optional(),
  tags: vine.array(vine.string().trim()).optional(),
  relatedPostIds: vine.array(vine.string().trim()).optional(),
  seo: seoSchema.clone().optional(),
}

export const storeBlogValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
    ...blogFields,
  })
)

export const updateBlogValidator = vine.compile(vine.object(blogFields))

export const blogStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['draft', 'scheduled', 'published', 'archived'] as const),
  })
)
