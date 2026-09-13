import vine from '@vinejs/vine'

const statusEnum = vine.enum(['active', 'inactive'] as const)
const itemTypeEnum = vine.enum(['category', 'filter', 'link'] as const)

const slugRule = vine
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const filterSchema = vine
  .object({
    category: vine.string().trim().optional(),
    brands: vine.array(vine.string().trim()).optional(),
    minPrice: vine.number().min(0).optional(),
    maxPrice: vine.number().min(0).optional(),
    attrs: vine.any().optional(),
    q: vine.string().trim().optional(),
    onlyDiscount: vine.boolean().optional(),
    onlyInStock: vine.boolean().optional(),
    fastDelivery: vine.boolean().optional(),
    minRating: vine.number().min(0).max(5).optional(),
  })
  .nullable()
  .optional()

export const storeMegaMenuValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    title: vine.string().trim().minLength(1),
    slug: slugRule.clone().optional(),
    icon: vine.string().trim().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const updateMegaMenuValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    slug: slugRule.clone().optional(),
    icon: vine.string().trim().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const megaMenuStatusValidator = vine.compile(
  vine.object({
    status: statusEnum.clone(),
  })
)

export const reorderMegaMenuValidator = vine.compile(
  vine.object({
    orderedIds: vine.array(vine.string().trim().minLength(1)).minLength(1),
  })
)

export const storeMegaMenuSectionValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    menuId: vine.string().trim().minLength(1),
    parentId: vine.string().trim().nullable().optional(),
    title: vine.string().trim().minLength(1),
    categoryId: vine.string().trim().nullable().optional(),
    slug: slugRule.clone().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const updateMegaMenuSectionValidator = vine.compile(
  vine.object({
    parentId: vine.string().trim().nullable().optional(),
    title: vine.string().trim().minLength(1),
    categoryId: vine.string().trim().nullable().optional(),
    slug: slugRule.clone().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const storeMegaMenuItemValidator = vine.compile(
  vine.object({
    id: vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    sectionId: vine.string().trim().minLength(1),
    title: vine.string().trim().minLength(1),
    type: itemTypeEnum.clone(),
    categoryId: vine.string().trim().nullable().optional(),
    slug: slugRule.clone().nullable().optional(),
    filter: filterSchema.clone(),
    url: vine.string().trim().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const updateMegaMenuItemValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    type: itemTypeEnum.clone(),
    categoryId: vine.string().trim().nullable().optional(),
    slug: slugRule.clone().nullable().optional(),
    filter: filterSchema.clone(),
    url: vine.string().trim().nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
    status: statusEnum.clone().optional(),
  })
)

export const megaMenusQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(['all', 'active', 'inactive'] as const).optional(),
  })
)
