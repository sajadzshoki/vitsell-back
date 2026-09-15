import CartItem from '#models/cart_item'
import Product from '#models/product'
import { productToCatalogWithStock } from '#utils/catalog_stock'
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
    const product = await Product.find(productId)
    if (!product) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }

    const variants = productVariants(product)
    const variant = findProductVariant(product, variantId)
    if (variants.length && !variant) {
      return response.unprocessableEntity({
        errors: [{ field: 'variantId', message: 'انتخاب واریانت الزامی است' }],
      })
    }
    if (variant && (variant.status !== 'active' || Number(variant.stock) < qty)) {
      return response.conflict({
        errors: [{ field: 'variantId', message: 'موجودی واریانت انتخاب‌شده کافی نیست' }],
      })
    }

    let itemQuery = CartItem.query().where('user_id', user.id).where('product_id', productId)
    itemQuery = variantId
      ? itemQuery.where('variant_id', variantId)
      : itemQuery.whereNull('variant_id')
    let item = await itemQuery.first()

    if (item) {
      if (variant && Number(variant.stock) < item.qty + qty) {
        return response.conflict({
          errors: [{ field: 'qty', message: 'موجودی واریانت انتخاب‌شده کافی نیست' }],
        })
      }
      item.qty += qty
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

    item.qty = qty
    await item.load('product')
    const variant = findProductVariant(item.product, item.variantId)
    if (variant && (variant.status !== 'active' || Number(variant.stock) < qty)) {
      return response.conflict({
        errors: [{ field: 'qty', message: 'موجودی واریانت انتخاب‌شده کافی نیست' }],
      })
    }
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
