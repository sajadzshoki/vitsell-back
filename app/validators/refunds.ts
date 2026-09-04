import vine from '@vinejs/vine'

const refundStatuses = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'] as const

const refundItem = vine.object({
  productId: vine.string().trim().optional(),
  productTitle: vine.string().trim(),
  qty: vine.number().min(1).optional(),
  amount: vine.number().min(0).optional(),
})

export const refundsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(refundStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type RefundsQuery = Awaited<ReturnType<(typeof refundsQueryValidator)['validate']>>

export const storeRefundValidator = vine.compile(
  vine.object({
    orderId: vine.string().trim(),
    returnId: vine.string().trim().nullable().optional(),
    amount: vine.number().min(1),
    reason: vine.string().trim().minLength(1),
    transactionId: vine.string().trim().optional(),
    status: vine.enum(['pending', 'processing', 'completed', 'failed', 'cancelled'] as const).optional(),
    items: vine.array(refundItem).optional(),
  })
)

export const updateRefundStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'processing', 'completed', 'failed', 'cancelled'] as const),
    transactionId: vine.string().trim().optional(),
  })
)
