import vine from '@vinejs/vine'

const statuses = ['all', 'draft', 'scheduled', 'sent', 'failed', 'cancelled'] as const
const types = [
  'all',
  'promotional',
  'order',
  'system',
  'inventory',
  'marketing',
  'announcement',
] as const

export const notificationsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(statuses).optional(),
    type: vine.enum(types).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type NotificationsQuery = Awaited<
  ReturnType<(typeof notificationsQueryValidator)['validate']>
>
