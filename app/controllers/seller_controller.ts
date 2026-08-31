import ContentBlock from '#models/content_block'
import Product from '#models/product'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const SITE_SETTINGS_KEY = 'siteSettings'
const SITE_SALES_KEY = 'siteSales'

const defaultSiteSettings = {
  name: 'دیجی‌شاپ',
  slug: 'digishop',
  phone: '02191000000',
  email: 'info@digishop.ir',
  city: 'تهران',
  about: 'فروشگاه اینترنتی دیجی‌شاپ',
  rating: 0,
  reviewCount: 0,
  joinDate: '',
}

const siteSettingsValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    phone: vine.string().trim(),
    email: vine.string().email(),
    city: vine.string().trim(),
    about: vine.string().trim(),
  })
)

const listingStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'pending', 'inactive', 'out_of_stock'] as const),
  })
)

const storeListingValidator = vine.compile(
  vine.object({
    product: vine.object({
      id: vine.string().trim().optional(),
      title: vine.string().trim(),
      shortName: vine.string().trim().optional(),
      brand: vine.string().trim(),
      category: vine.string().trim(),
      categoryLabel: vine.string().trim(),
      price: vine.number().min(1),
      oldPrice: vine.number().min(1).optional(),
      image: vine.string().trim(),
      imageDark: vine.string().trim().optional(),
      gallery: vine.array(vine.string()).optional(),
      colors: vine
        .array(
          vine.object({
            name: vine.string(),
            hex: vine.string(),
          })
        )
        .optional(),
      shortDesc: vine.string().trim().optional(),
      specs: vine
        .array(
          vine.object({
            key: vine.string(),
            value: vine.string(),
          })
        )
        .optional(),
      badge: vine.string().trim().optional(),
      inStock: vine.boolean().optional(),
      fastDelivery: vine.boolean().optional(),
    }),
    stock: vine.number().min(0),
    status: vine.enum(['active', 'pending', 'inactive', 'out_of_stock'] as const).optional(),
  })
)

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
      .slice(0, 48) || 'product'
  )
}

/**
 * Single-tenant admin panel under /seller.
 * No per-user shop: site settings + global catalog/ops.
 */
export default class SellerController {
  async shop({ response }: HttpContext) {
    const block = await ContentBlock.find(SITE_SETTINGS_KEY)
    const value = (block?.value as Record<string, unknown> | null) ?? null
    return response.ok({
      ...defaultSiteSettings,
      ...(value && typeof value === 'object' ? value : {}),
    })
  }

  async updateShop({ request, response }: HttpContext) {
    const payload = await request.validateUsing(siteSettingsValidator)
    const existing = await ContentBlock.find(SITE_SETTINGS_KEY)
    const prev = (existing?.value as Record<string, unknown> | null) ?? {}
    const next = {
      ...defaultSiteSettings,
      ...prev,
      ...payload,
    }
    await ContentBlock.updateOrCreate(
      { key: SITE_SETTINGS_KEY },
      { key: SITE_SETTINGS_KEY, value: next },
    )
    return response.ok(next)
  }

  async listings({ response }: HttpContext) {
    const listings = await SellerListing.query()
      .preload('product')
      .orderBy('updated_at', 'desc')
    return response.ok(
      listings.map((l) => ({
        ...l.toJSON(),
        ...(l.product ? { product: l.product.toCatalogJSON() } : {}),
      }))
    )
  }

  async storeListing({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeListingValidator)
    const p = payload.product
    const id = p.id?.trim() || `p-${slugify(p.shortName || p.title)}-${Date.now().toString().slice(-5)}`

    const product = await Product.updateOrCreate(
      { id },
      {
        id,
        title: p.title,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        rating: 0,
        reviews: 0,
        image: p.image,
        imageDark: p.imageDark ?? null,
        gallery: p.gallery?.length ? p.gallery : null,
        badge: p.badge || null,
        colors: p.colors?.length ? p.colors : null,
        inStock: p.inStock ?? payload.stock > 0,
        fastDelivery: p.fastDelivery ?? false,
        shortDesc: p.shortDesc ?? null,
        shortName: p.shortName ?? null,
        specs: p.specs?.length ? p.specs : null,
        scores: null,
        soldCount: 0,
        viewCount: 0,
      }
    )

    const status = payload.status ?? (payload.stock > 0 ? 'pending' : 'out_of_stock')

    let siteShop = await SellerShop.query().where('slug', 'digishop').first()
    if (!siteShop) {
      siteShop = await SellerShop.query().orderBy('id', 'asc').first()
    }
    if (!siteShop) {
      const admin = await User.query().where('role', 'admin').first()
      siteShop = await SellerShop.create({
        userId: admin?.id ?? 1,
        name: defaultSiteSettings.name,
        slug: defaultSiteSettings.slug,
        phone: defaultSiteSettings.phone,
        email: defaultSiteSettings.email,
        city: defaultSiteSettings.city,
        about: defaultSiteSettings.about,
        rating: 0,
        reviewCount: 0,
        joinDate: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date()),
      })
    }

    const existing = await SellerListing.query().where('product_id', product.id).first()
    let listing: SellerListing
    if (existing) {
      existing.stock = payload.stock
      existing.status = status
      await existing.save()
      listing = existing
    }
    else {
      listing = await SellerListing.create({
        shopId: siteShop.id,
        productId: product.id,
        stock: payload.stock,
        sold: 0,
        views: 0,
        status,
      })
    }

    return response.created({
      listing: listing.toJSON(),
      product: product.toCatalogJSON(),
    })
  }

  async updateListing({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(listingStatusValidator)
    const listing = await SellerListing.query().where('product_id', params.productId).first()
    if (!listing) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }
    listing.status = payload.status
    if (payload.status === 'out_of_stock') {
      listing.stock = 0
    }
    await listing.save()

    const product = await Product.find(listing.productId)
    if (product) {
      product.inStock = payload.status === 'active' || payload.status === 'pending'
        ? listing.stock > 0
        : payload.status !== 'out_of_stock' && listing.stock > 0
      if (payload.status === 'out_of_stock') product.inStock = false
      if (payload.status === 'active') product.inStock = true
      await product.save()
    }

    return response.ok(listing.toJSON())
  }

  async orders({ request, response }: HttpContext) {
    const sort = String(request.input('sort', 'newest'))
    let query = SellerOrder.query()
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

  async showOrder({ params, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    return response.ok(order.toJSON())
  }

  async updateOrderStatus({ params, request, response }: HttpContext) {
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
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    order.status = status
    await order.save()
    return response.ok(order.toJSON())
  }

  async reviews({ response }: HttpContext) {
    const reviews = await SellerReview.query().orderBy('created_at', 'desc')
    return response.ok(reviews.map((r) => r.toJSON()))
  }

  async replyReview({ params, request, response }: HttpContext) {
    const validator = vine.compile(vine.object({ reply: vine.string().trim() }))
    const { reply } = await request.validateUsing(validator)
    const review = await SellerReview.find(params.id)
    if (!review) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    review.reply = reply
    await review.save()
    return response.ok(review.toJSON())
  }

  async payouts({ response }: HttpContext) {
    const payouts = await SellerPayout.query().orderBy('created_at', 'desc')
    return response.ok(payouts.map((p) => p.toJSON()))
  }

  async sales({ response }: HttpContext) {
    const block = await ContentBlock.find(SITE_SALES_KEY)
    if (block?.value) {
      return response.ok(block.value)
    }
    // legacy seed key fallback
    const legacy = await ContentBlock.query().whereILike('key', 'sellerSales:%').first()
    return response.ok((legacy?.value as { label: string; value: number }[]) ?? [])
  }
}
