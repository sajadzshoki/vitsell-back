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

const coverageEnum = vine.enum(['nationwide', 'cities'] as const)
const holidayModeEnum = vine.enum(['use_weekday', 'custom', 'closed'] as const)
const statusEnum = vine.enum(['active', 'inactive'] as const)

const slotShape = vine.object({
  startTime: vine.string().trim().regex(/^\d{1,2}:\d{2}$/),
  endTime: vine.string().trim().regex(/^\d{1,2}:\d{2}$/),
  capacity: vine.number().min(0).max(10000),
  priceOverride: vine.number().min(0).nullable().optional(),
  sortOrder: vine.number().min(0).optional(),
})

export const createShippingMethodValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120),
    carrier: vine.string().trim().maxLength(120).optional(),
    estimatedDays: vine.string().trim().maxLength(80).optional(),
    baseCost: vine.number().min(0).optional(),
    status: statusEnum.optional(),
    sortOrder: vine.number().min(0).optional(),
    coverage: coverageEnum.optional(),
    slotsEnabled: vine.boolean().optional(),
    holidayMode: holidayModeEnum.optional(),
    expressEnabled: vine.boolean().optional(),
    expressPrice: vine.number().min(0).optional(),
    expressDeadlineHour: vine.number().min(0).max(23).optional(),
  })
)

export const updateShippingMethodValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(120).optional(),
    carrier: vine.string().trim().maxLength(120).optional(),
    estimatedDays: vine.string().trim().maxLength(80).optional(),
    baseCost: vine.number().min(0).optional(),
    status: statusEnum.optional(),
    sortOrder: vine.number().min(0).optional(),
    coverage: coverageEnum.optional(),
    slotsEnabled: vine.boolean().optional(),
    holidayMode: holidayModeEnum.optional(),
    expressEnabled: vine.boolean().optional(),
    expressPrice: vine.number().min(0).optional(),
    expressDeadlineHour: vine.number().min(0).max(23).optional(),
  })
)

export const shippingCityValidator = vine.compile(
  vine.object({
    province: vine.string().trim().minLength(1).maxLength(80),
    city: vine.string().trim().minLength(1).maxLength(80),
    price: vine.number().min(0),
    active: vine.boolean().optional(),
  })
)

export const replaceWeekdaySlotsValidator = vine.compile(
  vine.object({
    weekday: vine.number().min(0).max(6),
    slots: vine.array(slotShape),
  })
)

export const replaceHolidaySlotsValidator = vine.compile(
  vine.object({
    slots: vine.array(slotShape),
  })
)

export const dayOverrideValidator = vine.compile(
  vine.object({
    date: vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    isClosed: vine.boolean().optional(),
    useCustomSlots: vine.boolean().optional(),
    slots: vine.array(slotShape).optional(),
  })
)

export const calendarHolidayValidator = vine.compile(
  vine.object({
    date: vine.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: vine.string().trim().maxLength(120).optional(),
  })
)

export const publicShippingQueryValidator = vine.compile(
  vine.object({
    province: vine.string().trim().optional(),
    city: vine.string().trim().optional(),
  })
)

export const availabilityQueryValidator = vine.compile(
  vine.object({
    province: vine.string().trim().optional(),
    city: vine.string().trim().optional(),
    productIds: vine.string().optional(),
    days: vine.number().min(1).max(14).optional(),
  })
)
