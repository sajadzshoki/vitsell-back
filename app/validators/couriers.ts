import vine from '@vinejs/vine'

const phoneRule = vine.string().trim().regex(/^09\d{9}$/)
const nameRule = vine.string().trim().minLength(2).maxLength(80)

export const storeCourierValidator = vine.compile(
  vine.object({
    name: nameRule.clone(),
    phone: phoneRule.clone(),
  })
)

export const updateCourierValidator = vine.compile(
  vine.object({
    name: nameRule.clone(),
    phone: phoneRule.clone(),
  })
)

export const courierStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive'] as const),
  })
)

export const assignCourierValidator = vine.compile(
  vine.object({
    courierId: vine.number().positive().nullable(),
  })
)

export const deliverOrderValidator = vine.compile(
  vine.object({
    code: vine.string().trim().maxLength(12),
  })
)
