import SellerListing from '#models/seller_listing'
import type Product from '#models/product'
import { activeVariantStockTotal } from '#utils/product_variants'

/** Sum listing stock per product (single-shop may still have multiple rows). */
export async function stockByProductIds(productIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  const ids = [...new Set(productIds.filter(Boolean))]
  if (!ids.length) return map

  const listings = await SellerListing.query().whereIn('product_id', ids)
  for (const listing of listings) {
    const prev = map.get(listing.productId) ?? 0
    map.set(listing.productId, prev + (Number(listing.stock) || 0))
  }
  return map
}

/**
 * Catalog stock/availability for storefront cards.
 * PDP uses per-variant stock; listings often keep `seller_listings.stock` / `products.in_stock`
 * out of sync after variant edits — prefer the max of listing + active variant totals.
 */
export function resolveCatalogAvailability(product: Product, listingStock = 0) {
  const variantStock = activeVariantStockTotal(product)
  const stock = Math.max(0, Math.max(Number(listingStock) || 0, variantStock))
  return {
    stock,
    inStock: stock > 0,
  }
}

export async function productsToCatalogWithStock(products: Product[]) {
  const stocks = await stockByProductIds(products.map((p) => p.id))
  return products.map((p) => {
    const listingStock = stocks.get(p.id) ?? 0
    const { stock, inStock } = resolveCatalogAvailability(p, listingStock)
    return {
      ...p.toCatalogJSON(),
      stock,
      inStock,
    }
  })
}

export async function productToCatalogWithStock(product: Product) {
  const [json] = await productsToCatalogWithStock([product])
  return json
}
