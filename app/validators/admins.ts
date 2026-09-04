import vine from '@vinejs/vine'

export const adminsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive', 'suspended'] as const).optional(),
    roleId: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type AdminsQuery = Awaited<ReturnType<(typeof adminsQueryValidator)['validate']>>

const adminFields = {
  firstName: vine.string().trim().minLength(1),
  lastName: vine.string().trim().minLength(1),
  email: vine.string().trim().email(),
  phone: vine.string().trim().regex(/^09\d{9}$/),
  avatar: vine.string().trim().nullable().optional(),
  status: vine.enum(['active', 'inactive', 'suspended'] as const).optional(),
  roleIds: vine.array(vine.string().trim()).minLength(1),
  password: vine.string().minLength(8).maxLength(72).optional(),
}

export const storeAdminValidator = vine.compile(
  vine.object({
    ...adminFields,
    password: vine.string().minLength(8).maxLength(72),
  })
)

export const updateAdminValidator = vine.compile(
  vine.object({
    ...adminFields,
    password: vine.string().minLength(8).maxLength(72).optional(),
  })
)

export const adminStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive', 'suspended'] as const),
  })
)
