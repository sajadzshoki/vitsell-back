import vine from '@vinejs/vine'

const transactionTypes = [
  'all',
  'payment',
  'refund',
  'settlement',
  'adjustment',
  'fee',
] as const

const transactionStatuses = [
  'all',
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
] as const

export const transactionsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    type: vine.enum(transactionTypes).optional(),
    status: vine.enum(transactionStatuses).optional(),
    gateway: vine.string().trim().optional(),
    orderId: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(500).optional(),
    all: vine.boolean().optional(),
  })
)

export type TransactionsQuery = Awaited<
  ReturnType<(typeof transactionsQueryValidator)['validate']>
>
