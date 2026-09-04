import ProductAttribute from '#models/product_attribute'
import type { AttributesQuery } from '#validators/attribute'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type AttributeQuery = ModelQueryBuilderContract<typeof ProductAttribute, ProductAttribute>

function applyAttributeFilters(
  query: AttributeQuery,
  filters: AttributesQuery,
  options?: { includeStatus?: boolean; includeTrait?: boolean; includeType?: boolean }
) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const includeTrait = options?.includeTrait !== false
  const includeType = options?.includeType !== false

  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }

  if (includeType && filters.type && filters.type !== 'all') {
    q = q.where('type', filters.type)
  }

  if (includeTrait && filters.trait && filters.trait !== 'all') {
    if (filters.trait === 'filterable') q = q.where('filterable', true)
    else if (filters.trait === 'variant') q = q.where('variant_defining', true)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('name', like)
        .orWhereILike('slug', like)
        .orWhereILike('id', like)
    })
  }

  return q
}

async function statusCounts(filters: AttributesQuery) {
  const base = () =>
    applyAttributeFilters(ProductAttribute.query(), filters, { includeStatus: false })
  const [allRow, activeRow, inactiveRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('status', 'active').count('* as total').first(),
    base().where('status', 'inactive').count('* as total').first(),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    active: num(activeRow),
    inactive: num(inactiveRow),
  }
}

async function traitCounts(filters: AttributesQuery) {
  const base = () =>
    applyAttributeFilters(ProductAttribute.query(), filters, { includeTrait: false })
  const [allRow, filterableRow, variantRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('filterable', true).count('* as total').first(),
    base().where('variant_defining', true).count('* as total').first(),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    filterable: num(filterableRow),
    variant: num(variantRow),
  }
}

export async function querySellerAttributes(filters: AttributesQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const base = applyAttributeFilters(ProductAttribute.query(), filters)
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc')

  const countRow = await applyAttributeFilters(ProductAttribute.query(), filters)
    .count('* as total')
    .first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const items = wantAll
    ? await base.limit(pageSize)
    : await base.offset((page - 1) * pageSize).limit(pageSize)

  const [status, traits] = await Promise.all([statusCounts(filters), traitCounts(filters)])

  return {
    items: items.map((a) => a.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: status,
    traitCounts: traits,
  }
}
