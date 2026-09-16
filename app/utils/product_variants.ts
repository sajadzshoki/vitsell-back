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

export function productVariants(product: Product): ProductVariant[] {
  return Array.isArray(product.variants) ? (product.variants as ProductVariant[]) : []
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
