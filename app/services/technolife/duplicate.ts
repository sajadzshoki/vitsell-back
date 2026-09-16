import Product from '#models/product'
import { normalizeBrandKey, normalizePersianText } from '#services/technolife/persian'
import type {
  TechnolifeDuplicateMatch,
  TechnolifeNormalizedProduct,
} from '#services/technolife/types'

export async function findDuplicateProduct(
  product: TechnolifeNormalizedProduct
): Promise<TechnolifeDuplicateMatch | null> {
  if (product.sourceProductId) {
    const bySource = await Product.query()
      .where('source', 'technolife')
      .where('source_product_id', product.sourceProductId)
      .first()
    if (bySource) {
      return { productId: bySource.id, reason: 'source_product_id' }
    }

    const byId = await Product.find(`tl-${product.sourceProductId}`)
    if (byId) {
      return { productId: byId.id, reason: 'product_id' }
    }
  }

  if (product.sourceUrl) {
    const byUrl = await Product.query().where('source_url', product.sourceUrl).first()
    if (byUrl) {
      return { productId: byUrl.id, reason: 'source_url' }
    }
  }

  if (product.sku) {
    const bySku = await Product.query().where('sku', product.sku).first()
    if (bySku) {
      return { productId: bySku.id, reason: 'sku' }
    }
  }

  // Soft heuristic: same brand + overlapping title tokens (for reporting only when strong)
  if (product.brandName && product.model) {
    const brandKey = normalizeBrandKey(product.brandName)
    const modelKey = normalizePersianText(product.model).toLowerCase()
    const candidates = await Product.query()
      .whereILike('brand', `%${product.brandName.slice(0, 40)}%`)
      .limit(50)
    for (const c of candidates) {
      if (normalizeBrandKey(c.brand) !== brandKey) continue
      const title = normalizePersianText(c.title).toLowerCase()
      if (modelKey && title.includes(modelKey)) {
        return { productId: c.id, reason: 'brand_model' }
      }
    }
  }

  return null
}
