import vine from '@vinejs/vine'

const periodIds = [
  'today',
  'yesterday',
  'last_7',
  'last_30',
  'this_month',
  'last_month',
  'custom',
] as const

export const reportsQueryValidator = vine.compile(
  vine.object({
    period: vine.enum(periodIds).optional(),
    start: vine.string().trim().optional(),
    end: vine.string().trim().optional(),
  })
)

export type ReportsQuery = Awaited<ReturnType<(typeof reportsQueryValidator)['validate']>>

