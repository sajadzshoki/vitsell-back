import vine from '@vinejs/vine'

const orderStatuses = [
  'all',
  'new',
  'packing',
  'shipped',
  'delivered',
  'returned',
  'cancelled',
] as const

const paymentStatuses = [
  'all',
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const

const shippingStatuses = [
  'all',
  'unfulfilled',
  'ready',
  'shipped',
  'delivered',
  'returned',
] as const

const sortOptions = ['newest', 'oldest', 'amount_desc', 'amount_asc'] as const

export const ordersQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(orderStatuses).optional(),
    payment: vine.enum(paymentStatuses).optional(),
    shipping: vine.enum(shippingStatuses).optional(),
    paymentMethod: vine.string().trim().optional(),
    amountMin: vine.number().min(0).optional(),
    amountMax: vine.number().min(0).optional(),
    dateFrom: vine.string().trim().optional(),
    dateTo: vine.string().trim().optional(),
    hasDiscount: vine.boolean().optional(),
    hasRefund: vine.boolean().optional(),
    hasReturn: vine.boolean().optional(),
    needsTracking: vine.boolean().optional(),
    sort: vine.enum(sortOptions).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(500).optional(),
    all: vine.boolean().optional(),
  })
)

export type OrdersQuery = Awaited<ReturnType<(typeof ordersQueryValidator)['validate']>>
