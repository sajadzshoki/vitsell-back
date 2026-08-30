import SellerListing from '#models/seller_listing'
import SellerOrder, {
  SELLER_ORDER_TRANSITIONS,
  type SellerOrderStatus,
} from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import Product from '#models/product'
import ContentBlock from '#models/content_block'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

function faToday() {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function availableBalance(shopId: number) {
  const salesBlock = await ContentBlock.find(`sellerSales:${shopId}`)
  const sales = (salesBlock?.value as { label: string; value: number }[]) ?? []
  const monthSales = sales.reduce((sum, p) => sum + Number(p.value || 0), 0)
  const payouts = await SellerPayout.query().where('shop_id', shopId)
  const pending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const paid = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  return Math.max(0, monthSales - pending - paid)
}

export default class SellerController {
  async shop({ response, sellerShop }: HttpContext) {
    return response.ok(sellerShop!.toJSON())
  }

  async updateShop({ request, response, sellerShop }: HttpContext) {
    const shop = sellerShop!
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

  async listings({ response, sellerShop }: HttpContext) {
    const listings = await SellerListing.query().where('shop_id', sellerShop!.id)
    return response.ok(listings.map((l) => l.toJSON()))
  }

  async storeListing({ request, response, sellerShop }: HttpContext) {
    const shop = sellerShop!
    const validator = vine.compile(
      vine.object({
        stock: vine.number().min(0),
        status: vine
          .enum(['active', 'pending', 'inactive', 'out_of_stock'] as const)
          .optional(),
        product: vine.object({
          id: vine.string().trim(),
          title: vine.string().trim(),
          brand: vine.string().trim(),
          category: vine.string().trim(),
          categoryLabel: vine.string().trim().optional(),
          price: vine.number().min(0),
          oldPrice: vine.number().min(0).optional(),
          image: vine.string().trim(),
          gallery: vine.array(vine.string()).optional(),
          badge: vine.string().trim().optional(),
          colors: vine
            .array(vine.object({ name: vine.string(), hex: vine.string() }))
            .optional(),
          shortDesc: vine.string().trim().optional(),
          shortName: vine.string().trim().optional(),
          description: vine.string().trim().optional(),
          features: vine.array(vine.string()).optional(),
          buyNotes: vine
            .array(vine.object({ icon: vine.string(), text: vine.string() }))
            .optional(),
          specs: vine
            .array(vine.object({ key: vine.string(), value: vine.string() }))
            .optional(),
          inStock: vine.boolean().optional(),
          fastDelivery: vine.boolean().optional(),
        }),
      })
    )
    const payload = await request.validateUsing(validator)
    const status = payload.status ?? 'pending'
    let p = payload.product

    const ownedListing = await SellerListing.query()
      .where('shop_id', shop.id)
      .where('product_id', p.id)
      .first()

    const existingProduct = await Product.find(p.id)
    if (existingProduct && !ownedListing) {
      const otherOwner = await SellerListing.query().where('product_id', p.id).first()
      if (otherOwner) {
        return response.forbidden({
          errors: [
            {
              field: 'product.id',
              message: 'این محصول متعلق به فروشگاه دیگری است',
            },
          ],
        })
      }
      p = { ...p, id: `${p.id}-s${shop.id}-${Date.now().toString().slice(-4)}` }
    }

    let product = await Product.find(p.id)
    if (product && ownedListing) {
      product.merge({
        title: p.title,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel || product.categoryLabel || p.category,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        image: p.image,
        gallery: p.gallery ?? product.gallery,
        badge: p.badge ?? null,
        colors: p.colors ?? product.colors,
        shortDesc: p.shortDesc ?? null,
        shortName: p.shortName ?? null,
        description: p.description ?? product.description,
        features: p.features ?? product.features,
        buyNotes: p.buyNotes ?? product.buyNotes,
        specs: p.specs ?? product.specs,
        inStock: p.inStock ?? payload.stock > 0,
        fastDelivery: p.fastDelivery ?? false,
      })
      await product.save()
    } else if (!product) {
      product = await Product.create({
        id: p.id,
        title: p.title,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel || p.category,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        rating: 0,
        reviews: 0,
        image: p.image,
        gallery: p.gallery ?? null,
        badge: p.badge ?? null,
        colors: p.colors ?? null,
        inStock: p.inStock ?? payload.stock > 0,
        fastDelivery: p.fastDelivery ?? false,
        shortDesc: p.shortDesc ?? null,
        shortName: p.shortName ?? null,
        description: p.description ?? null,
        features: p.features ?? null,
        buyNotes: p.buyNotes ?? null,
        scores: null,
        specs: p.specs ?? null,
        soldCount: 0,
        viewCount: 0,
      })
    }

    let listing = ownedListing
    if (listing) {
      listing.merge({ stock: payload.stock, status })
      await listing.save()
    } else {
      listing = await SellerListing.create({
        shopId: shop.id,
        productId: product!.id,
        stock: payload.stock,
        sold: 0,
        views: 0,
        status,
      })
    }

    return response.created({
      listing: listing.toJSON(),
      product: product!.toCatalogJSON(),
    })
  }

  async updateListingStatus({ params, request, response, sellerShop }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        status: vine.enum(['active', 'pending', 'inactive', 'out_of_stock'] as const),
      })
    )
    const { status } = await request.validateUsing(validator)
    const listing = await SellerListing.query()
      .where('shop_id', sellerShop!.id)
      .where('product_id', params.productId)
      .first()
    if (!listing) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }
    listing.status = status
    await listing.save()
    return response.ok(listing.toJSON())
  }

  async orders({ request, response, sellerShop }: HttpContext) {
    const sort = String(request.input('sort', 'newest'))
    let query = SellerOrder.query().where('shop_id', sellerShop!.id)
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

  async showOrder({ params, response, sellerShop }: HttpContext) {
    const order = await SellerOrder.query()
      .where('shop_id', sellerShop!.id)
      .where('id', params.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    return response.ok(order.toJSON())
  }

  async updateOrderStatus({ params, request, response, sellerShop }: HttpContext) {
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
      .where('shop_id', sellerShop!.id)
      .where('id', params.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }

    const allowed = SELLER_ORDER_TRANSITIONS[order.status as SellerOrderStatus] ?? []
    if (!allowed.includes(status)) {
      return response.unprocessableEntity({
        errors: [
          {
            field: 'status',
            message: `انتقال وضعیت از ${order.status} به ${status} مجاز نیست`,
          },
        ],
      })
    }

    order.status = status
    await order.save()
    return response.ok(order.toJSON())
  }

  async reviews({ response, sellerShop }: HttpContext) {
    const reviews = await SellerReview.query().where('shop_id', sellerShop!.id)
    return response.ok(reviews.map((r) => r.toJSON()))
  }

  async replyReview({ params, request, response, sellerShop }: HttpContext) {
    const validator = vine.compile(vine.object({ reply: vine.string().trim() }))
    const { reply } = await request.validateUsing(validator)
    const review = await SellerReview.query()
      .where('shop_id', sellerShop!.id)
      .where('id', params.id)
      .first()
    if (!review) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    review.reply = reply
    await review.save()
    return response.ok(review.toJSON())
  }

  async payouts({ response, sellerShop }: HttpContext) {
    const payouts = await SellerPayout.query().where('shop_id', sellerShop!.id)
    return response.ok(payouts.map((p) => p.toJSON()))
  }

  async requestPayout({ request, response, sellerShop }: HttpContext) {
    const validator = vine.compile(vine.object({ amount: vine.number().min(1) }))
    const { amount } = await request.validateUsing(validator)
    const available = await availableBalance(sellerShop!.id)
    if (amount > available) {
      return response.unprocessableEntity({
        errors: [
          {
            field: 'amount',
            message: `مبلغ درخواستی بیشتر از موجودی قابل برداشت (${available}) است`,
          },
        ],
      })
    }

    const payout = await SellerPayout.create({
      id: `PO-${Date.now().toString().slice(-6)}`,
      shopId: sellerShop!.id,
      date: faToday(),
      amount,
      status: 'pending',
    })

    return response.created(payout.toJSON())
  }

  async sales({ response, sellerShop }: HttpContext) {
    const block = await ContentBlock.find(`sellerSales:${sellerShop!.id}`)
    return response.ok((block?.value as { label: string; value: number }[]) ?? [])
  }
}
