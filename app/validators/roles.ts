import vine from '@vinejs/vine'

export const rolesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type RolesQuery = Awaited<ReturnType<(typeof rolesQueryValidator)['validate']>>

export const storeRoleValidator = vine.compile(
  vine.object({
    key: vine.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]*$/),
    name: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    status: vine.enum(['active', 'inactive'] as const).optional(),
    permissions: vine.array(vine.string().trim()).optional(),
  })
)

export const updateRoleValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    status: vine.enum(['active', 'inactive'] as const).optional(),
    permissions: vine.array(vine.string().trim()).optional(),
  })
)
