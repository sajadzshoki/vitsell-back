import SellerShop from '#models/seller_shop'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import ContentBlock from '#models/content_block'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

async function shopFor(userId: number) {
  return SellerShop.query().where('user_id', userId).first()
}

export default class SellerController {
  async shop({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) {
      return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    }
    return response.ok(shop.toJSON())
  }

  async updateShop({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) {
      return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    }

    const validator = vine.compile(
      vine.object({
        name: vine.string().trim(),
        phone: vine.string(),
        email: vine.string().email(),
        city: vine.string(),
        about: vine.string(),
      })
    )
    const payload = await request.validateUsing(validator)
    shop.merge(payload)
    await shop.save()
    return response.ok(shop.toJSON())
  }

  async listings({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const listings = await SellerListing.query().where('shop_id', shop.id)
    return response.ok(listings.map((l) => l.toJSON()))
  }

  async orders({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })

    const sort = String(request.input('sort', 'newest'))
    let query = SellerOrder.query().where('shop_id', shop.id)
    switch (sort) {
      case 'oldest':
        query = query.orderBy('date_key', 'asc')
        break
      case 'amount_desc':
        query = query.orderBy('total', 'desc')
        break
      case 'amount_asc':
        query = query.orderBy('total', 'asc')
        break
      default:
        query = query.orderBy('date_key', 'desc')
    }

    const orders = await query
    return response.ok(orders.map((o) => o.toJSON()))
  }

  async showOrder({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const order = await SellerOrder.query()
      .where('shop_id', shop.id)
      .where('id', params.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    return response.ok(order.toJSON())
  }

  async updateOrderStatus({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })

    const validator = vine.compile(
      vine.object({
        status: vine.enum([
          'new',
          'packing',
          'shipped',
          'delivered',
          'returned',
          'cancelled',
        ] as const),
      })
    )
    const { status } = await request.validateUsing(validator)
    const order = await SellerOrder.query()
      .where('shop_id', shop.id)
      .where('id', params.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    order.status = status
    await order.save()
    return response.ok(order.toJSON())
  }

  async reviews({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const reviews = await SellerReview.query().where('shop_id', shop.id)
    return response.ok(reviews.map((r) => r.toJSON()))
  }

  async replyReview({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const validator = vine.compile(vine.object({ reply: vine.string().trim() }))
    const { reply } = await request.validateUsing(validator)
    const review = await SellerReview.query()
      .where('shop_id', shop.id)
      .where('id', params.id)
      .first()
    if (!review) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    review.reply = reply
    await review.save()
    return response.ok(review.toJSON())
  }

  async payouts({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const payouts = await SellerPayout.query().where('shop_id', shop.id)
    return response.ok(payouts.map((p) => p.toJSON()))
  }

  async sales({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const shop = await shopFor(user.id)
    if (!shop) return response.notFound({ errors: [{ field: 'shop', message: 'فروشگاه یافت نشد' }] })
    const block = await ContentBlock.find(`sellerSales:${shop.id}`)
    return response.ok((block?.value as { label: string; value: number }[]) ?? [])
  }
}
