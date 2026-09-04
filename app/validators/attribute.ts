import vine from '@vinejs/vine'

const attributeTypes = [
  'text',
  'select',
  'multi_select',
  'boolean',
  'number',
  'color',
  'measurement',
] as const

const slugRule = vine.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const valueSchema = vine.object({
  id: vine.string().trim().optional(),
  label: vine.string().trim(),
  value: vine.string().trim().optional(),
  meta: vine.string().trim().nullable().optional(),
  sortOrder: vine.number().min(0).optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  slug: vine.string().trim().optional(),
})

const attributeFields = {
  name: vine.string().trim().minLength(1),
  type: vine.enum(attributeTypes).optional(),
  values: vine.array(valueSchema).optional(),
  status: vine.enum(['active', 'inactive'] as const).optional(),
  sortOrder: vine.number().min(0).optional(),
  filterable: vine.boolean().optional(),
  searchable: vine.boolean().optional(),
  variantDefining: vine.boolean().optional(),
  categoryIds: vine.array(vine.string().trim()).optional(),
}

export const storeAttributeValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    slug: slugRule.clone(),
    ...attributeFields,
  })
)

export const updateAttributeValidator = vine.compile(vine.object(attributeFields))

export const attributeStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive'] as const),
  })
)

export const attributesQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
    type: vine.enum(['all', ...attributeTypes] as const).optional(),
    trait: vine.enum(['all', 'filterable', 'variant'] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type AttributesQuery = Awaited<
  ReturnType<(typeof attributesQueryValidator)['validate']>
>
