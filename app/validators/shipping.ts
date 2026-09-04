import vine from '@vinejs/vine'

export const shippingMethodsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
  })
)

export type ShippingMethodsQuery = Awaited<
  ReturnType<(typeof shippingMethodsQueryValidator)['validate']>
>

export const updateShippingMethodValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120).optional(),
    carrier: vine.string().trim().maxLength(120).optional(),
    estimatedDays: vine.string().trim().maxLength(80).optional(),
    baseCost: vine.number().min(0).optional(),
    status: vine.enum(['active', 'inactive'] as const).optional(),
    sortOrder: vine.number().min(0).optional(),
  })
)
