import ProductAttribute, {
  type AttributeType,
  type AttributeValue,
} from '#models/product_attribute'
import { normalizePersianText } from '#services/technolife/persian'
import { extractStorageLabel, slugifyTaxonomyPart } from '#services/technolife/series'
import type { TechnolifeColor, TechnolifeSpec } from '#services/technolife/types'

export type BuiltVariants = {
  hasVariants: boolean
  variantAxes: Array<{
    attributeId: string
    valueIds: string[]
    priceAdjustments?: Record<string, number>
  }>
  variants: Array<{
    id: string
    key: string
    options: Array<{
      attributeId: string
      attributeName: string
      valueId: string
      label: string
      meta?: string | null
    }>
    sku: string
    barcode: string
    price: number
    salePrice: number | null
    stock: number
    lowStockThreshold: number
    weight: string
    image: string
    status: 'active' | 'inactive'
  }>
  colors: Array<{ name: string; hex: string }>
  createdAttributeIds: string[]
  warnings: string[]
}

async function ensureAttribute(input: {
  id: string
  name: string
  slug: string
  type: AttributeType
  categoryIds: string[]
  createIfMissing: boolean
}): Promise<{ attr: ProductAttribute; created: boolean }> {
  let attr = await ProductAttribute.find(input.id)
  if (!attr) {
    attr = await ProductAttribute.query().where('slug', input.slug).first()
  }
  if (attr) {
    const cats = new Set([...(attr.categoryIds || []), ...input.categoryIds])
    const next = [...cats]
    if (next.length !== (attr.categoryIds || []).length) {
      attr.categoryIds = next
      await attr.save()
    }
    return { attr, created: false }
  }

  if (!input.createIfMissing) {
    throw new Error(`ویژگی «${input.name}» یافت نشد`)
  }

  const created = await ProductAttribute.create({
    id: input.id,
    name: input.name,
    slug: input.slug,
    type: input.type,
    values: [],
    status: 'active',
    sortOrder: 0,
    filterable: true,
    searchable: false,
    variantDefining: true,
    categoryIds: input.categoryIds,
  })
  return { attr: created, created: true }
}

function ensureValue(
  attr: ProductAttribute,
  input: { label: string; value: string; meta?: string | null; idHint?: string }
): AttributeValue {
  const values = Array.isArray(attr.values) ? [...attr.values] : []
  const labelKey = normalizePersianText(input.label)
  const valueKey = input.value.toLowerCase()
  const existing = values.find(
    (v) =>
      normalizePersianText(v.label) === labelKey ||
      String(v.value || '').toLowerCase() === valueKey ||
      String(v.id) === input.idHint
  )
  if (existing) return existing

  const created: AttributeValue = {
    id: input.idHint || `val-${attr.slug}-${slugifyTaxonomyPart(input.label)}-${values.length}`,
    label: input.label,
    value: valueKey || slugifyTaxonomyPart(input.label),
    meta: input.meta ?? null,
    sortOrder: values.length,
    status: 'active',
  }
  values.push(created)
  attr.values = values
  return created
}

/**
 * Ensure color/storage attributes exist, upsert missing values, and build product variants.
 * Technolife PDP color_items → color axis; storage from specs is kept as a selectable axis when present
 * with a single value (helps filters without inventing fake SKUs).
 */
export async function buildImportVariants(input: {
  colors: TechnolifeColor[]
  specs: TechnolifeSpec[]
  title: string
  categoryIds: string[]
  price: number
  oldPrice?: number | null
  stock: number
  sku?: string | null
  primaryImage: string
  createIfMissing?: boolean
}): Promise<BuiltVariants> {
  const createIfMissing = input.createIfMissing !== false
  const warnings: string[] = []
  const createdAttributeIds: string[] = []
  const categoryIds = [...new Set(input.categoryIds.filter(Boolean))]

  const colorAttr = await ensureAttribute({
    id: 'attr-color',
    name: 'رنگ',
    slug: 'color',
    type: 'color',
    categoryIds,
    createIfMissing,
  })
  if (colorAttr.created) createdAttributeIds.push(colorAttr.attr.id)

  const storageInfo = extractStorageLabel(input.specs, input.title)
  let storageAttr: ProductAttribute | null = null
  let storageValue: AttributeValue | null = null
  if (storageInfo) {
    const ensured = await ensureAttribute({
      id: 'attr-storage',
      name: 'حافظه داخلی',
      slug: 'storage',
      type: 'select',
      categoryIds,
      createIfMissing,
    })
    if (ensured.created) createdAttributeIds.push(ensured.attr.id)
    storageAttr = ensured.attr
    storageValue = ensureValue(ensured.attr, {
      label: storageInfo.label,
      value: storageInfo.value,
      idHint: storageInfo.idHint,
    })
    await ensured.attr.save()
  }

  const colors = input.colors.length
    ? input.colors
    : [{ name: 'پیش‌فرض', hex: '#808080' }]

  const colorValues: AttributeValue[] = []
  for (const color of colors) {
    const label = normalizePersianText(color.name) || 'پیش‌فرض'
    const value = slugifyTaxonomyPart(label) || `c-${colorValues.length}`
    const ensured = ensureValue(colorAttr.attr, {
      label,
      value,
      meta: color.hex || null,
      idHint: `color-${value}`,
    })
    colorValues.push(ensured)
  }
  await colorAttr.attr.save()

  const useColorAxis = colorValues.length >= 1 && !(colorValues.length === 1 && colors[0]?.name === 'پیش‌فرض')
  if (!useColorAxis && !storageValue) {
    return {
      hasVariants: false,
      variantAxes: [],
      variants: [],
      colors: input.colors.map((c) => ({ name: c.name, hex: c.hex })),
      createdAttributeIds,
      warnings,
    }
  }

  const variantAxes: BuiltVariants['variantAxes'] = []
  if (useColorAxis) {
    variantAxes.push({
      attributeId: colorAttr.attr.id,
      valueIds: colorValues.map((v) => v.id),
    })
  }
  if (storageAttr && storageValue) {
    variantAxes.push({
      attributeId: storageAttr.id,
      valueIds: [storageValue.id],
    })
  }

  const variants: BuiltVariants['variants'] = []
  const colorList = useColorAxis ? colorValues : [null]
  for (const colorVal of colorList) {
    const options: BuiltVariants['variants'][number]['options'] = []
    if (colorVal) {
      options.push({
        attributeId: colorAttr.attr.id,
        attributeName: colorAttr.attr.name,
        valueId: colorVal.id,
        label: colorVal.label,
        meta: colorVal.meta ?? null,
      })
    }
    if (storageAttr && storageValue) {
      options.push({
        attributeId: storageAttr.id,
        attributeName: storageAttr.name,
        valueId: storageValue.id,
        label: storageValue.label,
        meta: storageValue.meta ?? null,
      })
    }
    const key = options.map((o) => o.valueId).join('__') || 'default'
    const matchedColor = colorVal
      ? input.colors.find((c) => normalizePersianText(c.name) === normalizePersianText(colorVal.label))
      : null
    variants.push({
      id: `var-${key}`,
      key,
      options,
      sku: input.sku ? `${input.sku}-${slugifyTaxonomyPart(colorVal?.label || 'default')}` : '',
      barcode: '',
      price: input.oldPrice && input.oldPrice > input.price ? input.oldPrice : input.price,
      salePrice: input.oldPrice && input.oldPrice > input.price ? input.price : null,
      stock: Math.max(0, Math.floor(input.stock / Math.max(1, colorList.length))),
      lowStockThreshold: 5,
      weight: '',
      image: matchedColor?.image || input.primaryImage || '',
      status: 'active',
    })
  }

  if (!variants.length) {
    warnings.push('واریانتی از رنگ/حافظه ساخته نشد')
  }

  return {
    hasVariants: variants.length > 0,
    variantAxes,
    variants,
    colors: input.colors.map((c) => ({ name: c.name, hex: c.hex })),
    createdAttributeIds,
    warnings,
  }
}
