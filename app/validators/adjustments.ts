import vine from '@vinejs/vine'

const adjustmentTypes = [
  'all',
  'accounting_correction',
  'manual_refund_adjustment',
  'fee_correction',
  'other',
] as const

export const adjustmentsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    type: vine.enum(adjustmentTypes).optional(),
  })
)

export const storeAdjustmentValidator = vine.compile(
  vine.object({
    type: vine.enum([
      'accounting_correction',
      'manual_refund_adjustment',
      'fee_correction',
      'other',
    ] as const),
    amount: vine.number(),
    reason: vine.string().trim().minLength(1),
    orderId: vine.string().trim().nullable().optional(),
    actorId: vine.string().trim().optional(),
    actorName: vine.string().trim().optional(),
  })
)
