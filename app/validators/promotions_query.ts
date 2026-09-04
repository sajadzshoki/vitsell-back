import vine from '@vinejs/vine'
import { scheduleListStatuses } from '#utils/seller_schedule_filters'

export const discountCodesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(scheduleListStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type DiscountCodesQuery = Awaited<
  ReturnType<(typeof discountCodesQueryValidator)['validate']>
>

export const contentPromosQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type ContentPromosQuery = Awaited<
  ReturnType<(typeof contentPromosQueryValidator)['validate']>
>
