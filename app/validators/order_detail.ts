import vine from '@vinejs/vine'

export const orderTrackingValidator = vine.compile(
  vine.object({
    trackingCode: vine.string().trim().maxLength(120).optional(),
    carrier: vine.string().trim().maxLength(120).optional(),
    estimatedDelivery: vine.string().trim().maxLength(120).optional(),
  })
)

export const orderNoteValidator = vine.compile(
  vine.object({
    text: vine.string().trim().minLength(1).maxLength(2000),
    author: vine.string().trim().maxLength(80).optional(),
  })
)

export const orderRefundValidator = vine.compile(
  vine.object({
    amount: vine.number().min(1),
    reason: vine.string().trim().maxLength(500).optional(),
    transactionId: vine.string().trim().maxLength(120).optional(),
    status: vine
      .enum(['pending', 'processing', 'completed', 'failed', 'cancelled'] as const)
      .optional(),
  })
)
