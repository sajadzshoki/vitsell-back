import SellerListing from '#models/seller_listing'
import type Product from '#models/product'

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

export async function productsToCatalogWithStock(products: Product[]) {
  const stocks = await stockByProductIds(products.map((p) => p.id))
  return products.map((p) => ({
    ...p.toCatalogJSON(),
    stock: stocks.get(p.id) ?? 0,
  }))
}

export async function productToCatalogWithStock(product: Product) {
  const [json] = await productsToCatalogWithStock([product])
  return json
}
