import vine from '@vinejs/vine'

export const reconciliationQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    severity: vine.enum(['all', 'high', 'medium', 'low'] as const).optional(),
    status: vine.enum(['all', 'open', 'resolved'] as const).optional(),
  })
)

export const resolveDiscrepancyValidator = vine.compile(
  vine.object({
    id: vine.string().trim().minLength(1),
  })
)
