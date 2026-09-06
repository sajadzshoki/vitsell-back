import vine from '@vinejs/vine'

const paymentStatuses = [
  'all',
  'pending',
  'processing',
  'successful',
  'failed',
  'cancelled',
  'expired',
  'refunded',
  'partially_refunded',
] as const

export const sellerPaymentsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(paymentStatuses).optional(),
    gateway: vine.string().trim().optional(),
    orderId: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(500).optional(),
    all: vine.boolean().optional(),
  })
)

export type SellerPaymentsQuery = Awaited<
  ReturnType<(typeof sellerPaymentsQueryValidator)['validate']>
>
