import vine from '@vinejs/vine'

const warehouseFields = {
  name: vine.string().trim().minLength(1),
  code: vine.string().trim().minLength(1),
  city: vine.string().trim().optional(),
  address: vine.string().trim().optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  isDefault: vine.boolean().optional(),
}

export const storeWarehouseValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    ...warehouseFields,
  })
)

export const updateWarehouseValidator = vine.compile(vine.object(warehouseFields))

export const warehousesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type WarehousesQuery = Awaited<
  ReturnType<(typeof warehousesQueryValidator)['validate']>
>

const movementTypes = [
  'add',
  'remove',
  'adjust',
  'reserve',
  'release',
  'return',
  'refund',
  'correction',
] as const

export const movementsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    type: vine.enum(['all', ...movementTypes] as const).optional(),
    warehouseId: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type MovementsQuery = Awaited<
  ReturnType<(typeof movementsQueryValidator)['validate']>
>

export const storeMovementValidator = vine.compile(
  vine.object({
    productId: vine.string().trim(),
    productTitle: vine.string().trim().optional(),
    variantId: vine.string().trim().nullable().optional(),
    variantLabel: vine.string().trim().nullable().optional(),
    warehouseId: vine.string().trim(),
    type: vine.enum(movementTypes),
    quantity: vine.number(),
    before: vine.number().min(0),
    after: vine.number().min(0),
    reason: vine.string().trim().optional(),
    actorName: vine.string().trim().optional(),
  })
)

export const inventoryQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).optional(),
    warehouseId: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    brand: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type InventoryQuery = Awaited<
  ReturnType<(typeof inventoryQueryValidator)['validate']>
>

export const adjustInventoryValidator = vine.compile(
  vine.object({
    stock: vine.number().min(0),
    warehouseId: vine.string().trim().optional(),
    variantId: vine.string().trim().nullable().optional(),
    variantLabel: vine.string().trim().nullable().optional(),
    reason: vine.string().trim().optional(),
    actorName: vine.string().trim().optional(),
    type: vine.enum(movementTypes).optional(),
  })
)
