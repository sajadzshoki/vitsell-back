import CartItem from '#models/cart_item'
import Product from '#models/product'
import SellerListing from '#models/seller_listing'
import { productToCatalogWithStock } from '#utils/catalog_stock'
import { loadPlatformSettings } from '#utils/platform_settings'
import {
  catalogForVariant,
  findProductVariant,
  productVariantLabel,
  productVariants,
} from '#utils/product_variants'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const upsertValidator = vine.compile(
  vine.object({
    productId: vine.string(),
    variantId: vine.string().optional(),
    qty: vine.number().min(1).optional(),
  })
)

async function resolveSellableProduct(productId: string) {
  const product = await Product.find(productId)
  if (!product || product.published === false) return null
  const listing = await SellerListing.query()
    .where('product_id', productId)
    .whereIn('status', ['active', 'out_of_stock'])
    .first()
  if (!listing || listing.status === 'inactive') return null
  return { product, listing }
}

function availableStock(
  product: Product,
  listing: SellerListing,
  variantId?: string | null
) {
  const variants = productVariants(product)
  if (variants.length) {
    const variant = findProductVariant(product, variantId)
    if (!variant || variant.status !== 'active') return 0
    return Math.max(0, Number(variant.stock) || 0)
  }
  return Math.max(0, Number(listing.stock) || 0)
}

export default class CartController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const items = await CartItem.query().where('user_id', user.id).preload('product')

    const lines = await Promise.all(
      items
        .filter((i) => i.product)
        .map(async (i) => {
          const variant = findProductVariant(i.product, i.variantId)
          return {
            id: String(i.id),
            qty: i.qty,
            variantId: i.variantId,
            variantLabel: productVariantLabel(variant),
            product: variant
              ? catalogForVariant(i.product, variant)
              : await productToCatalogWithStock(i.product),
          }
        })
    )

    return response.ok(lines)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { productId, variantId, qty = 1 } = await request.validateUsing(upsertValidator)
    const resolved = await resolveSellableProduct(productId)
    if (!resolved) {
      return response.conflict({
        errors: [{ field: 'productId', message: 'این محصول برای خرید در دسترس نیست' }],
      })
    }
    const { product, listing } = resolved
    if (listing.status !== 'active') {
      return response.conflict({
        errors: [{ field: 'productId', message: 'این محصول ناموجود یا غیرفعال است' }],
      })
    }

    const variants = productVariants(product)
    const variant = findProductVariant(product, variantId)
    if (variants.length && !variant) {
      return response.unprocessableEntity({
        errors: [{ field: 'variantId', message: 'انتخاب واریانت الزامی است' }],
      })
    }
    if (variant && variant.status !== 'active') {
      return response.conflict({
        errors: [{ field: 'variantId', message: 'واریانت انتخاب‌شده فعال نیست' }],
      })
    }

    const platform = await loadPlatformSettings()
    const allowBackorder = platform.outOfStockBehavior === 'allow_backorder'
    const stock = availableStock(product, listing, variantId)

    let itemQuery = CartItem.query().where('user_id', user.id).where('product_id', productId)
    itemQuery = variantId
      ? itemQuery.where('variant_id', variantId)
      : itemQuery.whereNull('variant_id')
    let item = await itemQuery.first()
    const nextQty = (item?.qty ?? 0) + qty

    if (!allowBackorder && nextQty > stock) {
      return response.conflict({
        errors: [
          {
            field: 'qty',
            message:
              stock <= 0
                ? 'موجودی این محصول کافی نیست'
                : `حداکثر ${stock.toLocaleString('fa-IR')} عدد می‌توانید به سبد اضافه کنید`,
          },
        ],
      })
    }

    if (item) {
      item.qty = nextQty
      await item.save()
    } else {
      item = await CartItem.create({
        userId: user.id,
        productId,
        variantId: variantId ?? null,
        qty,
      })
    }

    await item.load('product')
    return response.ok({
      id: String(item.id),
      qty: item.qty,
      variantId: item.variantId,
      variantLabel: productVariantLabel(variant),
      product: variant
        ? catalogForVariant(item.product, variant)
        : await productToCatalogWithStock(item.product),
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const qty = Number(request.input('qty', 0))
    const item = await CartItem.query().where('user_id', user.id).where('id', params.lineId).first()

    if (!item) {
      return response.notFound({ errors: [{ field: 'lineId', message: 'آیتم سبد یافت نشد' }] })
    }

    if (qty <= 0) {
      await item.delete()
      return response.ok({ removed: true })
    }

    await item.load('product')
    if (!item.product || item.product.published === false) {
      return response.conflict({
        errors: [{ field: 'productId', message: 'این محصول برای خرید در دسترس نیست' }],
      })
    }

    const listing = await SellerListing.query()
      .where('product_id', item.productId)
      .where('status', 'active')
      .first()
    if (!listing) {
      return response.conflict({
        errors: [{ field: 'productId', message: 'این محصول ناموجود یا غیرفعال است' }],
      })
    }

    const platform = await loadPlatformSettings()
    const allowBackorder = platform.outOfStockBehavior === 'allow_backorder'
    const variant = findProductVariant(item.product, item.variantId)
    const stock = availableStock(item.product, listing, item.variantId)

    if (variant && variant.status !== 'active') {
      return response.conflict({
        errors: [{ field: 'qty', message: 'واریانت انتخاب‌شده فعال نیست' }],
      })
    }
    if (!allowBackorder && qty > stock) {
      return response.conflict({
        errors: [
          {
            field: 'qty',
            message:
              stock <= 0
                ? 'موجودی این محصول کافی نیست'
                : `حداکثر ${stock.toLocaleString('fa-IR')} عدد می‌توانید در سبد داشته باشید`,
          },
        ],
      })
    }

    item.qty = qty
    await item.save()
    return response.ok({
      id: String(item.id),
      qty: item.qty,
      variantId: item.variantId,
      variantLabel: productVariantLabel(variant),
      product: variant
        ? catalogForVariant(item.product, variant)
        : await productToCatalogWithStock(item.product),
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await CartItem.query().where('user_id', user.id).where('id', params.lineId).delete()
    return response.ok({ removed: true })
  }

  async clear({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await CartItem.query().where('user_id', user.id).delete()
    return response.ok({ cleared: true })
  }
}
