import vine from '@vinejs/vine'

export const categoriesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    /** Category parent id, `__root__` for roots only, or omit/`all` for any */
    parentId: vine.string().trim().optional(),
  })
)

export type CategoriesQuery = Awaited<
  ReturnType<(typeof categoriesQueryValidator)['validate']>
>
