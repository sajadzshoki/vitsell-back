import vine from '@vinejs/vine'

const blogStatuses = ['all', 'draft', 'scheduled', 'published', 'archived'] as const

export const blogQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(blogStatuses).optional(),
    category: vine.string().trim().optional(),
    author: vine.string().trim().optional(),
    featured: vine.boolean().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type BlogQuery = Awaited<ReturnType<(typeof blogQueryValidator)['validate']>>
