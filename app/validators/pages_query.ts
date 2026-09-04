import vine from '@vinejs/vine'

const pageStatuses = ['all', 'draft', 'published', 'archived'] as const

export const pagesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(pageStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type PagesQuery = Awaited<ReturnType<(typeof pagesQueryValidator)['validate']>>
