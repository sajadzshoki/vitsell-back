import ContentBlock from '#models/content_block'
import Category from '#models/category'
import Product, { normalizeImageAlts } from '#models/product'
import ProductQuestion from '#models/product_question'
import SellerListing from '#models/seller_listing'
import SellerOrder, { SELLER_ORDER_TRANSITIONS } from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import type { SeoMeta } from '#models/blog_post'
import { upsertCategorySpecKeys } from '#models/category_spec_key'
import { saveFooterPayload } from '#utils/footer'
import { computeSellerSalesPoints } from '#utils/seller_sales'
import { querySellerListings } from '#utils/seller_listings_query'
import { backfillOrphanSellerOrders } from '#utils/seller_order_backfill'
import { querySellerOrders } from '#utils/seller_orders_query'
import {
  buildSellerOrderDetail,
  pushTimeline,
  syncBuyerOrderStatus,
  type OrderInternalNote,
  type OrderRefundRecord,
} from '#utils/seller_order_detail'
import { adminHasPermission } from '#utils/seller_admins'
import { notifyOrderReadyToShip } from '#utils/order_sms'
import { assignCourierValidator } from '#validators/couriers'
import { listingsQueryValidator, bulkListingsDeleteValidator, bulkListingsPriceValidator } from '#validators/listings'
import db from '@adonisjs/lucid/services/db'
import { ordersQueryValidator } from '#validators/orders'
import { activeVariantStockTotal } from '#utils/product_variants'
import {
  orderNoteValidator,
  orderRefundValidator,
  orderTrackingValidator,
} from '#validators/order_detail'
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

const listingSeoSchema = vine.object({
  metaTitle: vine.string().trim().optional(),
  metaDescription: vine.string().trim().optional(),
  metaKeywords: vine.string().trim().optional(),
  canonicalUrl: vine.string().trim().optional(),
  robots: vine.string().trim().optional(),
  ogTitle: vine.string().trim().optional(),
  ogDescription: vine.string().trim().optional(),
  ogImage: vine.string().trim().optional(),
  twitterTitle: vine.string().trim().optional(),
  twitterDescription: vine.string().trim().optional(),
  twitterImage: vine.string().trim().optional(),
})

function emptyProductSeo(): SeoMeta {
  return {
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    robots: 'index,follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  }
}

function normalizeProductSeo(seo: Partial<SeoMeta> | null | undefined): SeoMeta | null {
  if (!seo || typeof seo !== 'object') return null
  const next = { ...emptyProductSeo(), ...seo }
  const hasAny = Object.entries(next).some(([key, value]) => {
    if (key === 'robots') return value !== 'index,follow'
    return Boolean(String(value || '').trim())
  })
  return hasAny ? next : null
}

const listingProductFields = {
  id: vine.string().trim().optional(),
  title: vine.string().trim(),
  shortName: vine.string().trim().optional(),
  brand: vine.string().trim().optional(),
  category: vine.string().trim(),
  categoryLabel: vine.string().trim(),
  price: vine.number().min(1),
  oldPrice: vine.number().min(1).optional(),
  image: vine.string().trim(),
  imageDark: vine.string().trim().optional(),
  gallery: vine.array(vine.string()).optional(),
  imageAlts: vine.any().optional(),
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
  featured: vine.boolean().optional(),
  published: vine.boolean().optional(),
  hasVariants: vine.boolean().optional(),
  sku: vine.string().trim().optional(),
  barcode: vine.string().trim().optional(),
  weight: vine.string().trim().optional(),
  lowStockThreshold: vine.number().min(0).optional(),
  variantAxes: vine.array(vine.any()).optional(),
  variants: vine.array(vine.any()).optional(),
  seo: listingSeoSchema.clone().optional(),
  tags: vine.array(vine.string().trim()).optional(),
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

async function assertListingCategory(
  categoryId: string,
  response: HttpContext['response']
) {
  const id = categoryId.trim()
  if (!id) {
    response.badRequest({
      errors: [{ field: 'product.category', message: 'دسته‌بندی الزامی است' }],
    })
    return false
  }
  const cat = await Category.find(id)
  if (!cat) {
    response.badRequest({
      errors: [{ field: 'product.category', message: 'دسته‌بندی انتخاب‌شده یافت نشد' }],
    })
    return false
  }
  if (cat.status === 'inactive') {
    response.badRequest({
      errors: [{ field: 'product.category', message: 'دسته‌بندی غیرفعال است؛ ابتدا آن را فعال کنید' }],
    })
    return false
  }
  return true
}

async function resolveSiteShop() {
  let siteShop = await SellerShop.query().where('slug', 'vitsell').first()
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

  async listings({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['hasDiscount', 'hasVariants', 'featured', 'published', 'all'] as const) {
      const raw = qs[key]
      if (raw === '1' || raw === 'true') qs[key] = true
      else if (raw === '0' || raw === 'false') qs[key] = false
      else if (raw === '' || raw == null) delete qs[key]
    }
    for (const key of ['priceMin', 'priceMax', 'page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.status === 'all') delete qs.status
    if (qs.stock === 'all') delete qs.stock

    const filters = await listingsQueryValidator.validate(qs)
    const result = await querySellerListings(filters)
    return response.ok(result)
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
    if (!(await assertListingCategory(p.category, response))) return
    const id = p.id?.trim() || `p-${slugify(p.shortName || p.title)}-${Date.now().toString().slice(-5)}`

    const product = await Product.updateOrCreate(
      { id },
      {
        id,
        title: p.title,
        brand: p.brand ?? '',
        category: p.category,
        categoryLabel: p.categoryLabel,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        rating: 0,
        reviews: 0,
        image: p.image,
        imageDark: p.imageDark ?? null,
        gallery: p.gallery?.length ? p.gallery : null,
        imageAlts: normalizeImageAlts(p.imageAlts),
        badge: p.badge || null,
        colors: p.colors?.length ? p.colors : null,
        inStock: p.inStock ?? payload.stock > 0,
        fastDelivery: p.fastDelivery ?? false,
        shortDesc: p.shortDesc ?? null,
        shortName: p.shortName ?? null,
        description: p.description ?? null,
        features: p.features?.length ? p.features : null,
        specs: p.specs?.length ? p.specs : null,
        featured: p.featured ?? false,
        published: p.published ?? true,
        hasVariants: p.hasVariants ?? false,
        sku: p.sku?.trim() || null,
        barcode: p.barcode?.trim() || null,
        weight: p.weight?.trim() || null,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        variantAxes: Array.isArray(p.variantAxes) && p.variantAxes.length ? p.variantAxes : null,
        variants: Array.isArray(p.variants) && p.variants.length ? p.variants : null,
        seo: normalizeProductSeo(p.seo),
        tags: p.tags?.length ? p.tags.map((t) => t.trim()).filter(Boolean) : [],
        scores: null,
        soldCount: 0,
        viewCount: 0,
      }
    )

    await upsertCategorySpecKeys(product.category, product.specs)

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
      if (!(await assertListingCategory(p.category, response))) return
      product = await Product.updateOrCreate(
        { id: listing.productId },
        {
          id: listing.productId,
          title: p.title,
          brand: p.brand ?? '',
          category: p.category,
          categoryLabel: p.categoryLabel,
          price: p.price,
          oldPrice: p.oldPrice ?? null,
          rating: product?.rating ?? 0,
          reviews: product?.reviews ?? 0,
          image: p.image,
          imageDark: p.imageDark ?? null,
          gallery: p.gallery?.length ? p.gallery : null,
          imageAlts:
            p.imageAlts !== undefined ? normalizeImageAlts(p.imageAlts) : product?.imageAlts ?? null,
          badge: p.badge || null,
          colors: p.colors?.length ? p.colors : null,
          inStock: p.inStock ?? (payload.stock ?? listing.stock) > 0,
          fastDelivery: p.fastDelivery ?? false,
          shortDesc: p.shortDesc ?? null,
          shortName: p.shortName ?? null,
          description: p.description ?? product?.description ?? null,
          features: p.features?.length ? p.features : product?.features ?? null,
          specs: p.specs?.length ? p.specs : null,
          featured: p.featured ?? product?.featured ?? false,
          published: p.published ?? product?.published ?? true,
          hasVariants: p.hasVariants ?? product?.hasVariants ?? false,
          sku: p.sku !== undefined ? p.sku?.trim() || null : product?.sku ?? null,
          barcode: p.barcode !== undefined ? p.barcode?.trim() || null : product?.barcode ?? null,
          weight: p.weight !== undefined ? p.weight?.trim() || null : product?.weight ?? null,
          lowStockThreshold: p.lowStockThreshold ?? product?.lowStockThreshold ?? 5,
          variantAxes:
            p.variantAxes !== undefined
              ? (Array.isArray(p.variantAxes) && p.variantAxes.length ? p.variantAxes : null)
              : product?.variantAxes ?? null,
          variants:
            p.variants !== undefined
              ? (Array.isArray(p.variants) && p.variants.length ? p.variants : null)
              : product?.variants ?? null,
          seo: p.seo !== undefined ? normalizeProductSeo(p.seo) : product?.seo ?? null,
          tags:
            p.tags !== undefined
              ? p.tags.map((t) => t.trim()).filter(Boolean)
              : product?.tags ?? [],
          scores: product?.scores ?? null,
          soldCount: product?.soldCount ?? 0,
          viewCount: product?.viewCount ?? 0,
        }
      )

      await upsertCategorySpecKeys(product.category, product.specs)
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
      if (status === 'out_of_stock') {
        product.inStock = false
      } else {
        const variantStock = activeVariantStockTotal(product)
        product.inStock = Math.max(Number(listing.stock) || 0, variantStock) > 0
      }
      await product.save()
    }

    await listing.load('product')
    return response.ok({
      listing: listing.toJSON(),
      ...(listing.product ? { product: listing.product.toCatalogJSON() } : {}),
    })
  }

  async orders({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['status', 'payment', 'shipping', 'paymentMethod', 'q', 'sort'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    for (const key of ['page', 'pageSize', 'amountMin', 'amountMax'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    for (const key of ['hasDiscount', 'hasRefund', 'hasReturn', 'needsTracking', 'all'] as const) {
      if (qs[key] === '1' || qs[key] === 'true') qs[key] = true
      else if (qs[key] === '0' || qs[key] === 'false' || qs[key] === '') delete qs[key]
    }
    if (qs.dateFrom === '') delete qs.dateFrom
    if (qs.dateTo === '') delete qs.dateTo

    const filters = await ordersQueryValidator.validate(qs)
    // Repair storefront orders placed before SellerOrder was wired into checkout
    await backfillOrphanSellerOrders()
    return response.ok(await querySellerOrders(filters))
  }

  async showOrder({ params, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    return response.ok(await buildSellerOrderDetail(order))
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

    const previous = order.status
    order.status = status
    if (!isSame) {
      pushTimeline(order, 'تغییر وضعیت', 'ادمین', `${previous} → ${status}`)
    }
    await order.save()

    if (!isSame) {
      await syncBuyerOrderStatus(order)
    }

    if (!isSame && status === 'packing') {
      await notifyOrderReadyToShip(order)
    }

    return response.ok(await buildSellerOrderDetail(order))
  }

  async assignCourier({ auth, params, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    if (!(await adminHasPermission(actor, 'orders.update'))) {
      return response.forbidden({
        errors: [{ message: 'دسترسی به‌روزرسانی سفارش لازم است' }],
      })
    }

    const { courierId } = await request.validateUsing(assignCourierValidator)
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    if (order.status === 'delivered') {
      return response.unprocessableEntity({
        errors: [{ message: 'پس از تحویل نمی‌توان پیک را تغییر داد' }],
      })
    }

    if (courierId == null) {
      order.courierId = null
      await order.save()
      return response.ok(await buildSellerOrderDetail(order))
    }

    if (Number(courierId) === Number(order.courierId)) {
      return response.ok(await buildSellerOrderDetail(order))
    }

    const courier = await User.query()
      .where('id', courierId)
      .where('role', 'courier')
      .where('status', 'active')
      .first()
    if (!courier) {
      return response.unprocessableEntity({
        errors: [{ field: 'courierId', message: 'پیک فعال یافت نشد' }],
      })
    }

    order.courierId = courier.id
    await order.save()
    return response.ok(await buildSellerOrderDetail(order))
  }

  async updateOrderTracking({ params, request, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    const payload = await request.validateUsing(orderTrackingValidator)
    if (payload.trackingCode != null) order.trackingCode = payload.trackingCode.trim()
    if (payload.carrier != null) order.carrier = payload.carrier.trim()
    if (payload.estimatedDelivery != null) {
      order.estimatedDelivery = payload.estimatedDelivery.trim()
    }
    pushTimeline(
      order,
      'ثبت کد پیگیری',
      'ادمین',
      order.trackingCode || undefined,
    )
    await order.save()
    if (order.status === 'packing' || order.status === 'shipped') {
      await notifyOrderReadyToShip(order)
    }
    return response.ok(await buildSellerOrderDetail(order))
  }

  async addOrderNote({ params, request, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    const payload = await request.validateUsing(orderNoteValidator)
    const note: OrderInternalNote = {
      id: `note-${Date.now().toString(36)}`,
      text: payload.text.trim(),
      author: (payload.author ?? 'ادمین').trim() || 'ادمین',
      createdAt: new Date().toISOString(),
    }
    const notes = Array.isArray(order.internalNotes) ? [...order.internalNotes] : []
    order.internalNotes = [note, ...notes]
    pushTimeline(order, 'یادداشت داخلی', note.author)
    await order.save()
    return response.ok(await buildSellerOrderDetail(order))
  }

  async createOrderRefund({ params, request, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    const payload = await request.validateUsing(orderRefundValidator)
    const amount = Math.round(payload.amount)
    const { sumActiveRefundsForOrder } = await import('#utils/seller_refunds_query')
    const { completed, reserved } = await sumActiveRefundsForOrder(order.id)
    const remaining = Math.max(0, Number(order.total) - completed - reserved)
    if (amount <= 0 || amount > remaining) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: `مبلغ بازپرداخت باید بین ۱ و ${remaining} باشد` }],
      })
    }
    const status = payload.status ?? 'completed'
    const refundId = `RF-${Date.now().toString(36).toUpperCase()}`
    const refund: OrderRefundRecord = {
      id: refundId,
      amount,
      reason: (payload.reason ?? 'بازپرداخت سفارش').trim() || 'بازپرداخت سفارش',
      status,
      transactionId: (payload.transactionId ?? '').trim(),
      createdAt: new Date().toISOString(),
      actorName: 'ادمین',
    }
    const refunds = Array.isArray(order.refunds) ? [...order.refunds] : []
    order.refunds = [refund, ...refunds]
    if (status === 'completed') {
      order.refundedAmount = completed + amount
    }
    pushTimeline(order, 'ثبت بازپرداخت', 'ادمین', `${amount.toLocaleString('fa-IR')} تومان`)
    await order.save()

    const { default: SellerRefundModel } = await import('#models/seller_refund')
    await SellerRefundModel.create({
      id: refundId,
      orderId: order.id,
      returnId: null,
      customerName: order.customerName,
      status: status as any,
      amount,
      orderTotal: Number(order.total) || 0,
      alreadyRefunded: completed,
      reason: refund.reason,
      transactionId: refund.transactionId,
      items: [],
    })

    return response.created(await buildSellerOrderDetail(order))
  }

  async destroyOrder({ params, response }: HttpContext) {
    const order = await SellerOrder.find(params.id)
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }

    const SellerOrderItemRow = (await import('#models/seller_order_item_row')).default
    const SellerReturn = (await import('#models/seller_return')).default
    const SellerRefund = (await import('#models/seller_refund')).default

    await SellerOrderItemRow.query().where('sellerOrderId', order.id).delete()
    await SellerReturn.query().where('orderId', order.id).delete()
    await SellerRefund.query().where('orderId', order.id).delete()
    await order.delete()

    return response.ok({ id: params.id, deleted: true })
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
      author: author?.trim() || 'کارشناس ویتسل',
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
    const fees = Math.round(rounded * 0.01)
    const payout = await SellerPayout.create({
      id,
      shopId: siteShop.id,
      date: jalaliishDate(),
      amount: rounded,
      status: 'pending',
      fees,
      gateway: 'زرین‌پال',
      source: 'gateway',
      reference: '',
      note: null,
      settlementStatus: 'pending',
    })
    return response.created(payout.toJSON())
  }

  async destroyListing({ params, response }: HttpContext) {
    const result = await deleteListingRecord(String(params.productId || ''))
    if (!result.ok) {
      if (result.code === 'not_found') {
        return response.notFound({
          errors: [{ field: 'productId', message: result.message }],
        })
      }
      return response.conflict({
        errors: [{ field: 'productId', message: result.message }],
      })
    }
    return response.ok({
      message: 'محصول حذف شد',
      productId: result.productId,
    })
  }

  async bulkDestroyListings({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkListingsDeleteValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    const deleted: string[] = []
    const failed: Array<{ id: string; message: string }> = []

    for (const id of ids) {
      const result = await deleteListingRecord(id)
      if (result.ok) {
        deleted.push(result.productId)
        continue
      }
      if (result.code === 'not_found') {
        // Treat missing as already gone for bulk UX
        continue
      }
      failed.push({ id, message: result.message })
    }

    return response.ok({
      deleted: deleted.length,
      failed,
      deletedIds: deleted,
    })
  }

  async bulkAdjustListingPrices({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkListingsPriceValidator)
    const ids = [...new Set((payload.ids || []).map((id) => id.trim()).filter(Boolean))]
    const category = payload.category?.trim() || ''
    const brand = payload.brand?.trim() || ''

    if (!ids.length && !category && !brand) {
      return response.unprocessableEntity({
        errors: [{ field: 'scope', message: 'دسته، برند یا محصول را مشخص کنید' }],
      })
    }
    if (payload.direction === 'decrease' && payload.percent >= 100) {
      return response.unprocessableEntity({
        errors: [{ field: 'percent', message: 'کاهش قیمت باید کمتر از ۱۰۰ درصد باشد' }],
      })
    }

    const factor = payload.direction === 'increase'
      ? 1 + payload.percent / 100
      : 1 - payload.percent / 100

    const matchedIds = () => {
      const query = db
        .from('products')
        .join('seller_listings', 'seller_listings.product_id', 'products.id')
        .distinct('products.id')
      if (ids.length) query.whereIn('products.id', ids)
      if (category) query.where('products.category', category)
      if (brand) query.where('products.brand', brand)
      return query
    }

    const countRow = await db.from(matchedIds().as('matched')).count('* as total').first()
    const count = Number(countRow?.total ?? 0)

    if (payload.dryRun || count === 0) {
      return response.ok({ count, updated: 0 })
    }

    const updated = await db
      .from('products')
      .whereIn('id', matchedIds())
      .update({
        price: db.raw('GREATEST(0, ROUND(price * CAST(? AS numeric)))::bigint', [factor]),
        old_price: db.raw(
          `CASE
            WHEN old_price IS NULL THEN NULL
            ELSE GREATEST(
              GREATEST(0, ROUND(price * CAST(? AS numeric)))::bigint,
              GREATEST(0, ROUND(old_price * CAST(? AS numeric)))::bigint
            )
          END`,
          [factor, factor],
        ),
        updated_at: new Date(),
      })

    return response.ok({
      count,
      updated: Number(updated) || count,
    })
  }

  async sales({ response }: HttpContext) {
    const points = await computeSellerSalesPoints()
    // Keep a cached snapshot for dashboards that still read content_blocks
    await ContentBlock.updateOrCreate(
      { key: SITE_SALES_KEY },
      { key: SITE_SALES_KEY, value: points }
    )
    return response.ok(points)
  }
}

type DeleteListingResult =
  | { ok: true; productId: string }
  | { ok: false; code: 'not_found' | 'conflict'; message: string }

async function deleteListingRecord(productId: string): Promise<DeleteListingResult> {
  const id = String(productId || '').trim()
  if (!id) {
    return { ok: false, code: 'not_found', message: 'محصول یافت نشد' }
  }

  const listing = await SellerListing.query().where('product_id', id).first()
  if (!listing) {
    return { ok: false, code: 'not_found', message: 'محصول یافت نشد' }
  }

  try {
    await listing.delete()
    const product = await Product.find(id)
    if (product) {
      await product.delete()
    }
  } catch {
    return {
      ok: false,
      code: 'conflict',
      message: 'حذف محصول ممکن نیست؛ هنوز ارجاعی به این محصول وجود دارد',
    }
  }

  return { ok: true, productId: id }
}
