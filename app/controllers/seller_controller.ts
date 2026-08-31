import ContentBlock from '#models/content_block'
import Product from '#models/product'
import ProductQuestion from '#models/product_question'
import SellerListing from '#models/seller_listing'
import SellerOrder, { SELLER_ORDER_TRANSITIONS } from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import { saveFooterPayload } from '#utils/footer'
import {
  defaultSiteSettings,
  loadFooterWithSiteOverlay,
  loadSiteSettings,
  saveSiteSettings,
  SiteSettingsError,
  syncSiteSettingsFromFooter,
} from '#utils/site_settings'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const SITE_SALES_KEY = 'siteSales'

const siteSettingsValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    phone: vine.string().trim().regex(/^09\d{9}$/),
    email: vine.string().email(),
    city: vine.string().trim(),
    about: vine.string().trim(),
  })
)

const footerValidator = vine.compile(
  vine.object({
    about: vine.string().trim(),
    copyright: vine.string().trim(),
    trustItems: vine.array(
      vine.object({
        id: vine.string().trim(),
        icon: vine.string().trim(),
        title: vine.string().trim(),
        subtitle: vine.string().trim(),
      })
    ),
    columns: vine.array(
      vine.object({
        id: vine.string().trim(),
        title: vine.string().trim(),
        links: vine.array(
          vine.object({
            label: vine.string().trim(),
            to: vine.string().trim(),
          })
        ),
      })
    ),
    socials: vine.array(
      vine.object({
        id: vine.string().trim(),
        label: vine.string().trim(),
        icon: vine.string().trim(),
        href: vine.string().trim(),
      })
    ),
    contact: vine.object({
      phones: vine.array(
        vine.object({
          label: vine.string().trim(),
          href: vine.string().trim(),
        })
      ),
      email: vine.object({
        label: vine.string().trim(),
        href: vine.string().trim(),
      }),
    }),
    appStores: vine.array(
      vine.object({
        id: vine.string().trim(),
        label: vine.string().trim(),
        icon: vine.string().trim(),
        href: vine.string().trim(),
      })
    ),
    badges: vine.array(
      vine.object({
        id: vine.string().trim(),
        label: vine.string().trim(),
        icon: vine.string().trim(),
      })
    ),
  })
)

const listingStatusEnum = ['active', 'pending', 'inactive', 'out_of_stock'] as const

const listingProductFields = {
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
  description: vine.string().trim().optional(),
  features: vine.array(vine.string()).optional(),
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
}

const storeListingValidator = vine.compile(
  vine.object({
    product: vine.object(listingProductFields),
    stock: vine.number().min(0),
    status: vine.enum(listingStatusEnum).optional(),
  })
)

/** Status-only or full product+stock update from admin panel */
const updateListingValidator = vine.compile(
  vine.object({
    status: vine.enum(listingStatusEnum).optional(),
    stock: vine.number().min(0).optional(),
    product: vine.object(listingProductFields).optional(),
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

async function resolveSiteShop() {
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
  return siteShop
}

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Single-tenant admin panel under /seller.
 * No per-user shop: site settings + global catalog/ops.
 */
export default class SellerController {
  async shop({ response }: HttpContext) {
    return response.ok(await loadSiteSettings())
  }

  async updateShop({ request, response }: HttpContext) {
    const payload = await request.validateUsing(siteSettingsValidator)
    try {
      const next = await saveSiteSettings(payload, { syncFooter: true })
      return response.ok(next)
    } catch (err) {
      if (err instanceof SiteSettingsError) {
        return response.unprocessableEntity({
          errors: [{ field: err.field, message: err.message }],
        })
      }
      throw err
    }
  }

  async footer({ response }: HttpContext) {
    return response.ok(await loadFooterWithSiteOverlay())
  }

  async updateFooter({ request, response }: HttpContext) {
    const payload = await request.validateUsing(footerValidator)
    try {
      await saveFooterPayload(payload)
      await syncSiteSettingsFromFooter(payload)
    } catch (err) {
      if (err instanceof SiteSettingsError) {
        return response.unprocessableEntity({
          errors: [{ field: err.field, message: err.message }],
        })
      }
      throw err
    }
    return response.ok(await loadFooterWithSiteOverlay())
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

  async showListing({ params, response }: HttpContext) {
    const listing = await SellerListing.query()
      .where('product_id', params.productId)
      .preload('product')
      .first()
    if (!listing) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }
    return response.ok({
      ...listing.toJSON(),
      ...(listing.product ? { product: listing.product.toCatalogJSON() } : {}),
    })
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

    const siteShop = await resolveSiteShop()

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
    const payload = await request.validateUsing(updateListingValidator)
    const listing = await SellerListing.query().where('product_id', params.productId).first()
    if (!listing) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }

    if (payload.status == null && payload.stock == null && !payload.product) {
      return response.unprocessableEntity({
        errors: [{ field: 'status', message: 'حداقل یکی از status، stock یا product لازم است' }],
      })
    }

    let product = await Product.find(listing.productId)

    if (payload.product) {
      const p = payload.product
      product = await Product.updateOrCreate(
        { id: listing.productId },
        {
          id: listing.productId,
          title: p.title,
          brand: p.brand,
          category: p.category,
          categoryLabel: p.categoryLabel,
          price: p.price,
          oldPrice: p.oldPrice ?? null,
          rating: product?.rating ?? 0,
          reviews: product?.reviews ?? 0,
          image: p.image,
          imageDark: p.imageDark ?? null,
          gallery: p.gallery?.length ? p.gallery : null,
          badge: p.badge || null,
          colors: p.colors?.length ? p.colors : null,
          inStock: p.inStock ?? (payload.stock ?? listing.stock) > 0,
          fastDelivery: p.fastDelivery ?? false,
          shortDesc: p.shortDesc ?? null,
          shortName: p.shortName ?? null,
          description: p.description ?? product?.description ?? null,
          features: p.features?.length ? p.features : product?.features ?? null,
          specs: p.specs?.length ? p.specs : null,
          scores: product?.scores ?? null,
          soldCount: product?.soldCount ?? 0,
          viewCount: product?.viewCount ?? 0,
        }
      )
    }

    if (payload.stock != null) {
      listing.stock = payload.stock
    }

    if (payload.status) {
      listing.status = payload.status
      if (payload.status === 'out_of_stock') {
        listing.stock = 0
      }
    }
    else if (payload.stock != null && payload.stock <= 0 && listing.status === 'active') {
      listing.status = 'out_of_stock'
    }

    await listing.save()

    if (product) {
      const status = listing.status
      if (status === 'out_of_stock') product.inStock = false
      else if (status === 'active') product.inStock = listing.stock > 0
      else if (status === 'pending') product.inStock = listing.stock > 0
      else product.inStock = listing.stock > 0
      await product.save()
    }

    await listing.load('product')
    return response.ok({
      listing: listing.toJSON(),
      ...(listing.product ? { product: listing.product.toCatalogJSON() } : {}),
    })
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

    const allowed = SELLER_ORDER_TRANSITIONS[order.status] ?? []
    const isSame = status === order.status
    const isAdjacent
      = allowed.includes(status)
        || Object.entries(SELLER_ORDER_TRANSITIONS).some(
          ([from, tos]) => from === status && tos.includes(order.status)
        )
    if (!isSame && !isAdjacent) {
      return response.unprocessableEntity({
        errors: [{ field: 'status', message: 'تغییر وضعیت مجاز نیست' }],
      })
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

  async questions({ response }: HttpContext) {
    const questions = await ProductQuestion.query().orderBy('created_at', 'desc')
    return response.ok(questions.map((q) => q.toJSON()))
  }

  async replyQuestion({ params, request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        text: vine.string().trim().minLength(2).maxLength(2000),
        author: vine.string().trim().minLength(2).maxLength(80).optional(),
      })
    )
    const { text, author } = await request.validateUsing(validator)
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }

    const previous = question.answer
    question.answer = {
      author: author?.trim() || 'کارشناس دیجی‌شاپ',
      date: jalaliishDate(),
      text,
      helpfulYes: previous?.helpfulYes ?? 0,
      helpfulNo: previous?.helpfulNo ?? 0,
      role: 'support',
    }
    await question.save()
    return response.ok(question.toJSON())
  }

  async clearQuestionAnswer({ params, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    question.answer = null
    await question.save()
    return response.ok(question.toJSON())
  }

  async setQuestionVerified({ params, request, response }: HttpContext) {
    const validator = vine.compile(vine.object({ verified: vine.boolean() }))
    const { verified } = await request.validateUsing(validator)
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    question.verified = verified
    await question.save()
    return response.ok(question.toJSON())
  }

  async destroyQuestion({ params, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    await question.delete()
    return response.ok({ ok: true })
  }

  async payouts({ response }: HttpContext) {
    const payouts = await SellerPayout.query().orderBy('created_at', 'desc')
    return response.ok(payouts.map((p) => p.toJSON()))
  }

  async storePayout({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        amount: vine.number().min(1),
      })
    )
    const { amount } = await request.validateUsing(validator)
    const rounded = Math.round(amount)
    if (rounded <= 0) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: 'مبلغ تسویه نامعتبر است' }],
      })
    }

    const siteShop = await resolveSiteShop()
    const id = `PO-${Math.floor(1000 + Math.random() * 9000)}`
    const payout = await SellerPayout.create({
      id,
      shopId: siteShop.id,
      date: jalaliishDate(),
      amount: rounded,
      status: 'pending',
    })
    return response.created(payout.toJSON())
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
