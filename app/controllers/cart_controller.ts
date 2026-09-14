import CartItem from '#models/cart_item'
import Product from '#models/product'
import { productToCatalogWithStock, productsToCatalogWithStock } from '#utils/catalog_stock'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const upsertValidator = vine.compile(
  vine.object({
    productId: vine.string(),
    qty: vine.number().min(1).optional(),
  })
)

export default class CartController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const items = await CartItem.query()
      .where('user_id', user.id)
      .preload('product')

    const products = items.filter((i) => i.product).map((i) => i.product)
    const catalogs = await productsToCatalogWithStock(products)
    const byId = new Map(catalogs.map((p) => [p.id, p]))

    const lines = items
      .filter((i) => i.product)
      .map((i) => ({
        id: i.productId,
        qty: i.qty,
        product: byId.get(i.productId) ?? i.product.toCatalogJSON(),
      }))

    return response.ok(lines)
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { productId, qty = 1 } = await request.validateUsing(upsertValidator)
    const product = await Product.find(productId)
    if (!product) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }

    let item = await CartItem.query()
      .where('user_id', user.id)
      .where('product_id', productId)
      .first()

    if (item) {
      item.qty += qty
      await item.save()
    } else {
      item = await CartItem.create({ userId: user.id, productId, qty })
    }

    await item.load('product')
    return response.ok({
      id: item.productId,
      qty: item.qty,
      product: await productToCatalogWithStock(item.product),
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const qty = Number(request.input('qty', 0))
    const item = await CartItem.query()
      .where('user_id', user.id)
      .where('product_id', params.productId)
      .first()

    if (!item) {
      return response.notFound({ errors: [{ field: 'productId', message: 'آیتم سبد یافت نشد' }] })
    }

    if (qty <= 0) {
      await item.delete()
      return response.ok({ removed: true })
    }

    item.qty = qty
    await item.save()
    await item.load('product')
    return response.ok({
      id: item.productId,
      qty: item.qty,
      product: await productToCatalogWithStock(item.product),
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await CartItem.query()
      .where('user_id', user.id)
      .where('product_id', params.productId)
      .delete()
    return response.ok({ removed: true })
  }

  async clear({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await CartItem.query().where('user_id', user.id).delete()
    return response.ok({ cleared: true })
  }
}
