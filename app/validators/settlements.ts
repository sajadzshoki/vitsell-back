import vine from '@vinejs/vine'

const settlementStatuses = [
  'all',
  'pending',
  'processing',
  'completed',
  'failed',
  'reconciled',
] as const

const settlementSources = ['gateway', 'bank', 'manual'] as const

export const settlementsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(settlementStatuses).optional(),
    source: vine.enum(['all', ...settlementSources] as const).optional(),
    gateway: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type SettlementsQuery = Awaited<
  ReturnType<(typeof settlementsQueryValidator)['validate']>
>

export const storeSettlementValidator = vine.compile(
  vine.object({
    amount: vine.number().min(1),
    fees: vine.number().min(0).optional(),
    source: vine.enum(settlementSources).optional(),
    gateway: vine.string().trim().minLength(1).optional(),
    reference: vine.string().trim().optional(),
    note: vine.string().trim().optional(),
  })
)

export const updateSettlementStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'pending',
      'processing',
      'completed',
      'failed',
      'reconciled',
    ] as const),
    reference: vine.string().trim().optional(),
  })
)
