import vine from '@vinejs/vine'

const returnStatuses = [
  'all',
  'requested',
  'approved',
  'rejected',
  'received',
  'processing',
  'completed',
  'cancelled',
] as const

const returnItem = vine.object({
  productId: vine.string().trim(),
  productTitle: vine.string().trim().optional(),
  variantLabel: vine.string().trim().nullable().optional(),
  sku: vine.string().trim().optional(),
  qty: vine.number().min(1),
  unitPrice: vine.number().min(0),
})

export const returnsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(returnStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type ReturnsQuery = Awaited<ReturnType<(typeof returnsQueryValidator)['validate']>>

export const storeReturnValidator = vine.compile(
  vine.object({
    orderId: vine.string().trim(),
    customerId: vine.string().trim().optional(),
    customerName: vine.string().trim().optional(),
    reason: vine.string().trim().minLength(1),
    adminNote: vine.string().trim().optional(),
    items: vine.array(returnItem).minLength(1),
  })
)

export const storeCustomerReturnValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(1),
    photos: vine.array(vine.string().trim().maxLength(500)).maxLength(5).optional(),
    items: vine
      .array(
        vine.object({
          productId: vine.string().trim(),
          qty: vine.number().min(1),
          variantId: vine.string().trim().nullable().optional(),
        })
      )
      .minLength(1),
  })
)

export const updateReturnStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'requested',
      'approved',
      'rejected',
      'received',
      'processing',
      'completed',
      'cancelled',
    ] as const),
    adminNote: vine.string().trim().optional(),
  })
)
