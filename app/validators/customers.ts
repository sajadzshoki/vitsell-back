import vine from '@vinejs/vine'

const customerStatuses = ['all', 'active', 'inactive', 'blocked'] as const
const sortOptions = ['newest', 'oldest', 'spending_desc', 'spending_asc', 'name'] as const

export const customersQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(customerStatuses).optional(),
    hasOrders: vine.boolean().optional(),
    spendMin: vine.number().min(0).optional(),
    spendMax: vine.number().min(0).optional(),
    sort: vine.enum(sortOptions).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type CustomersQuery = Awaited<ReturnType<(typeof customersQueryValidator)['validate']>>

export const updateCustomerValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(80).optional(),
    lastName: vine.string().trim().minLength(1).maxLength(80).optional(),
    email: vine.string().trim().email().optional().nullable(),
    phone: vine.string().trim().minLength(10).maxLength(15).optional(),
    status: vine.enum(['active', 'inactive', 'blocked'] as const).optional(),
  })
)

export const updateCustomerStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive', 'blocked'] as const),
  })
)

export const bulkCustomerStatusValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim()).minLength(1),
    status: vine.enum(['active', 'inactive', 'blocked'] as const),
  })
)
