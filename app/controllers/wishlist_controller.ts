import WishlistItem from '#models/wishlist_item'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const storeValidator = vine.compile(
  vine.object({
    productId: vine.string(),
  })
)

export default class WishlistController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const items = await WishlistItem.query()
      .where('user_id', user.id)
      .preload('product')

    return response.ok(
      items.filter((i) => i.product).map((i) => i.product.toCatalogJSON())
    )
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { productId } = await request.validateUsing(storeValidator)
    const product = await Product.find(productId)
    if (!product) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }

    const existing = await WishlistItem.query()
      .where('user_id', user.id)
      .where('product_id', productId)
      .first()

    if (!existing) {
      await WishlistItem.create({ userId: user.id, productId })
    }

    return response.ok(product.toCatalogJSON())
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await WishlistItem.query()
      .where('user_id', user.id)
      .where('product_id', params.productId)
      .delete()
    return response.ok({ removed: true })
  }
}
