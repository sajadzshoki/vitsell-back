import type Product from '#models/product'
import { toPublicMediaUrl } from '#utils/media_upload'

export type ProductVariantOption = {
  attributeId: string
  attributeName: string
  valueId: string
  label: string
  meta?: string | null
}

export type ProductVariant = {
  id: string
  options: ProductVariantOption[]
  stock: number
  status: 'active' | 'inactive'
  image?: string
  sku?: string
  barcode?: string
  weight?: string
}

type ProductVariantAxis = {
  attributeId: string
  priceAdjustments?: Record<string, number>
}

export function productVariants(product: Product | { variants?: unknown[] | null }): ProductVariant[] {
  return Array.isArray(product.variants) ? (product.variants as ProductVariant[]) : []
}

type AxisWithMeta = ProductVariantAxis & {
  valueIds?: string[]
  valueMeta?: Record<string, { label: string; attributeName: string; meta?: string | null }>
}

/** Ensure axis valueMeta exists for every valueId (incl. 0-adjustment options). */
export function enrichVariantAxes(
  product: Product | { variantAxes?: unknown[] | null; variants?: unknown[] | null }
) {
  const axes = Array.isArray(product.variantAxes)
    ? (product.variantAxes as AxisWithMeta[])
    : []
  if (!axes.length) return axes

  const variants = productVariants(product)
  return axes.map((axis) => {
    const valueIds = (axis.valueIds ?? []).map(String)
    const valueMeta = { ...(axis.valueMeta ?? {}) }
    const priceAdjustments = { ...(axis.priceAdjustments ?? {}) }

    for (const variant of variants) {
      for (const option of variant.options) {
        if (option.attributeId !== axis.attributeId) continue
        const valueId = String(option.valueId)
        if (!valueIds.includes(valueId)) continue
        if (!valueMeta[valueId]?.label) {
          valueMeta[valueId] = {
            label: option.label,
            attributeName: option.attributeName,
            ...(option.meta ? { meta: option.meta } : {}),
          }
        }
        if (priceAdjustments[valueId] == null) priceAdjustments[valueId] = 0
      }
    }

    for (const valueId of valueIds) {
      if (priceAdjustments[valueId] == null) priceAdjustments[valueId] = 0
    }

    return {
      ...axis,
      valueIds,
      valueMeta,
      priceAdjustments,
    }
  })
}

/** Sum stock across active variants (sellable inventory on the PDP). */
export function activeVariantStockTotal(
  product: Product | { variants?: unknown[] | null; hasVariants?: boolean }
): number {
  const rows = productVariants(product)
  if (!rows.length) return 0
  let total = 0
  for (const variant of rows) {
    if (String(variant.status || 'active') !== 'active') continue
    total += Math.max(0, Number(variant.stock) || 0)
  }
  return total
}

export function hasSellableVariant(
  product: Product | { variants?: unknown[] | null; hasVariants?: boolean }
): boolean {
  return activeVariantStockTotal(product) > 0
}

export function findProductVariant(product: Product, variantId?: string | null) {
  if (!variantId) return null
  return productVariants(product).find((variant) => variant.id === variantId) ?? null
}

export function productVariantPrice(product: Product, variant: ProductVariant | null) {
  if (!variant) return Number(product.price)
  const axes = Array.isArray(product.variantAxes)
    ? (product.variantAxes as ProductVariantAxis[])
    : []
  const byAttribute = new Map(axes.map((axis) => [axis.attributeId, axis]))
  const adjustment = variant.options.reduce((sum, option) => {
    const amount = Number(byAttribute.get(option.attributeId)?.priceAdjustments?.[option.valueId])
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
  return Math.max(0, Number(product.price) + adjustment)
}

export function productVariantLabel(variant: ProductVariant | null) {
  return variant?.options.map((option) => option.label).join(' / ') ?? ''
}

export function catalogForVariant(product: Product, variant: ProductVariant | null) {
  const catalog = product.toCatalogJSON()
  if (!variant) return catalog
  const price = productVariantPrice(product, variant)
  const baseOldPrice = product.oldPrice === null ? null : Number(product.oldPrice)
  const adjustment = price - Number(product.price)
  const oldPrice = baseOldPrice === null ? null : Math.max(price, baseOldPrice + adjustment)
  return {
    ...catalog,
    price,
    ...(oldPrice !== null && oldPrice > price ? { oldPrice } : {}),
    image: toPublicMediaUrl(variant.image || '') || catalog.image,
    inStock: variant.status === 'active' && Number(variant.stock) > 0,
    stock: Math.max(0, Number(variant.stock) || 0),
    sku: variant.sku || catalog.sku,
    barcode: variant.barcode || catalog.barcode,
    weight: variant.weight || catalog.weight,
  }
}

/** Apply stock delta to a specific variant on the product JSON (mutates product.variants). */
export function applyVariantStockDelta(
  product: Product,
  variantId: string | null | undefined,
  delta: number
) {
  if (!variantId || !delta) return null
  const rows = productVariants(product)
  if (!rows.length) return null
  let matched: ProductVariant | null = null
  const next = rows.map((variant) => {
    if (variant.id !== variantId) return variant
    const stock = Math.max(0, (Number(variant.stock) || 0) + delta)
    matched = { ...variant, stock }
    return matched
  })
  if (!matched) return null
  product.variants = next
  product.hasVariants = true
  return matched
}
