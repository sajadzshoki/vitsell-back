import vine from '@vinejs/vine'
import { scheduleListStatuses } from '#utils/seller_schedule_filters'

export const dealsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(scheduleListStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type DealsQuery = Awaited<ReturnType<(typeof dealsQueryValidator)['validate']>>
