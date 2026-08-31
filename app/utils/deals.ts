import type Product from '#models/product'

export function dealPriceFrom(basePrice: number, discountPercent: number) {
  const percent = Math.min(99, Math.max(1, Math.round(discountPercent)))
  return Math.max(0, Math.round(Number(basePrice) * (100 - percent) / 100))
}

export function applyDealToCatalog(product: Product, discountPercent: number) {
  const base = product.toCatalogJSON() as Record<string, unknown>
  const originalPrice = Number(product.price)
  return {
    ...base,
    oldPrice: originalPrice,
    price: dealPriceFrom(originalPrice, discountPercent),
    badge: base.badge || 'شگفت‌انگیز',
  }
}
