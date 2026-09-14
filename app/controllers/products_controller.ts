import Product from '#models/product'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'
import SellerReview from '#models/seller_review'
import SellerShop from '#models/seller_shop'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { parseStoredUploadName, toPublicMediaUrl } from '#utils/media_upload'
import {
  applyCatalogFilters,
  loadFilterableAttributes,
  parseAttrFilters,
} from '#utils/catalog_filters'
import { loadPlatformSettings } from '#utils/platform_settings'
import {
  productToCatalogWithStock,
  productsToCatalogWithStock,
} from '#utils/catalog_stock'

const SORTS = [
  'relevant',
  'viewed',
  'bestselling',
  'newest',
  'fastest',
  'expensive',
  'cheapest',
  'bestrated',
  'discount',
] as const

const storeReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5),
    text: vine.string().trim().minLength(10).maxLength(2000),
    pros: vine.array(vine.string().trim().minLength(1).maxLength(80)).maxLength(10).optional(),
    cons: vine.array(vine.string().trim().minLength(1).maxLength(80)).maxLength(10).optional(),
    recommend: vine.boolean().optional(),
    images: vine
      .array(vine.string().trim().maxLength(500))
      .maxLength(5)
      .optional(),
  })
)

const storeQuestionValidator = vine.compile(
  vine.object({
    question: vine.string().trim().minLength(10).maxLength(1000),
  })
)

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function displayName(user: {
  phone: string
  profile?: { firstName?: string | null; lastName?: string | null } | null
}) {
  const full = [user.profile?.firstName, user.profile?.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ')
  if (full) return full
  return `کاربر ${user.phone.slice(-4)}`
}

async function refreshProductRating(product: Product) {
  const rows = await ProductReview.query().where('product_id', product.id)
  const count = rows.length
  if (!count) {
    product.reviews = 0
    product.rating = 0
  } else {
    const sum = rows.reduce((acc, row) => acc + row.rating, 0)
    product.reviews = count
    product.rating = Math.round((sum / count) * 10) / 10
  }
  await product.save()
  return product
}

export default class ProductsController {
  async index({ request, response }: HttpContext) {
    const q = String(request.input('q', '')).trim()
    const category = String(request.input('category', '')).trim()
    const brandsRaw = request.input('brands', [])
    const brands = Array.isArray(brandsRaw)
      ? brandsRaw.map(String)
      : String(brandsRaw || '')
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
    const minPrice = Number(request.input('minPrice', 0)) || 0
    const maxPrice = Number(request.input('maxPrice', 250_000_000)) || 250_000_000
    const onlyDiscount = String(request.input('onlyDiscount', 'false')) === 'true'
    const onlyInStock = String(request.input('onlyInStock', 'false')) === 'true'
    const fastDelivery = String(request.input('fastDelivery', 'false')) === 'true'
    const minRating = Number(request.input('minRating', 0)) || 0
    const attrs = parseAttrFilters(request.input('attrs'))
    const sort = String(request.input('sort', 'relevant')) as (typeof SORTS)[number]
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const pageSize = Math.min(48, Math.max(1, Number(request.input('pageSize', 12)) || 12))

    const attributeMeta = Object.keys(attrs).length
      ? await loadFilterableAttributes(category)
      : []

    const platform = await loadPlatformSettings()
    const forceInStock = platform.outOfStockBehavior === 'hide' || onlyInStock

    let query = applyCatalogFilters(Product.query(), {
      q,
      category,
      brands,
      minPrice,
      maxPrice,
      onlyDiscount,
      onlyInStock: forceInStock,
      fastDelivery,
      minRating,
      attrs,
    }, { attributeMeta })

    switch (sort) {
      case 'viewed':
        query = query.orderBy('view_count', 'desc')
        break
      case 'bestselling':
        query = query.orderBy('sold_count', 'desc')
        break
      case 'newest':
        query = query.orderBy('created_at', 'desc')
        break
      case 'fastest':
        query = query.orderBy('fast_delivery', 'desc').orderBy('rating', 'desc')
        break
      case 'expensive':
        query = query.orderBy('price', 'desc')
        break
      case 'cheapest':
        query = query.orderBy('price', 'asc')
        break
      case 'bestrated':
        query = query.orderBy('rating', 'desc')
        break
      case 'discount':
        query = query.orderByRaw(
          'CASE WHEN old_price IS NULL OR old_price = 0 THEN 0 ELSE (old_price - price)::float / old_price END DESC'
        )
        break
      default:
        query = query.orderBy('rating', 'desc')
    }

    const totalQuery = query.clone().clearOrder().clearSelect().count('* as total')
    const totalRow = await totalQuery.first()
    const total = Number((totalRow as any)?.$extras?.total ?? (totalRow as any)?.total ?? 0)

    const items = await query.offset((page - 1) * pageSize).limit(pageSize)

    return response.ok({
      items: await productsToCatalogWithStock(items),
      total,
      page,
      pageSize,
    })
  }

  /**
   * Facets for the current search scope (all matching rows, not page limit):
   * price min/max, brands, and category filterable/variant attributes.
   */
  async facets({ request, response }: HttpContext) {
    const q = String(request.input('q', '')).trim()
    const category = String(request.input('category', '')).trim()
    const onlyDiscount = String(request.input('onlyDiscount', 'false')) === 'true'
    const onlyInStock = String(request.input('onlyInStock', 'false')) === 'true'
    const fastDelivery = String(request.input('fastDelivery', 'false')) === 'true'
    const minRating = Number(request.input('minRating', 0)) || 0

    const platform = await loadPlatformSettings()
    const forceInStock = platform.outOfStockBehavior === 'hide' || onlyInStock

    // Price/brand facets ignore price + brand + attr selections so ranges stay stable.
    const base = applyCatalogFilters(
      Product.query(),
      { q, category, onlyDiscount, onlyInStock: forceInStock, fastDelivery, minRating },
      { skipPrice: true, skipBrands: true, skipAttrs: true }
    )

    const priceRow = await base
      .clone()
      .clearOrder()
      .clearSelect()
      .min('price as min_price')
      .max('price as max_price')
      .first()

    const brandRows = await base
      .clone()
      .clearOrder()
      .clearSelect()
      .distinct('brand')
      .orderBy('brand', 'asc')

    const minPrice = Math.max(0, Number((priceRow as any)?.$extras?.min_price ?? (priceRow as any)?.min_price ?? 0))
    let maxPrice = Math.max(
      minPrice,
      Number((priceRow as any)?.$extras?.max_price ?? (priceRow as any)?.max_price ?? 0)
    )
    if (!maxPrice) maxPrice = 250_000_000

    const brands = brandRows
      .map((row) => String(row.brand || '').trim())
      .filter(Boolean)

    const attributes = await loadFilterableAttributes(category)

    return response.ok({
      minPrice,
      maxPrice,
      brands,
      attributes,
    })
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }
    product.viewCount += 1
    await product.save()
    return response.ok(await productToCatalogWithStock(product))
  }

  async reviews({ params, request, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }

    const sort = String(request.input('sort', 'newest'))
    let query = ProductReview.query().where('product_id', product.id)

    switch (sort) {
      case 'helpful':
        query = query.orderBy('helpful_count', 'desc')
        break
      case 'high':
        query = query.orderBy('rating', 'desc')
        break
      case 'low':
        query = query.orderBy('rating', 'asc')
        break
      default:
        query = query.orderBy('created_at', 'desc')
    }

    const reviews = await query
    return response.ok(reviews.map((r) => r.toJSON()))
  }

  async storeReview({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }

    const payload = await request.validateUsing(storeReviewValidator)
    await user.load('profile')

    const images = (payload.images ?? [])
      .map((url) => toPublicMediaUrl(String(url || '').trim()))
      .filter((url) => Boolean(parseStoredUploadName(url)))
      .slice(0, 5)

    const review = await ProductReview.create({
      id: `r${Date.now()}`,
      productId: product.id,
      userId: user.id,
      name: displayName(user),
      date: jalaliishDate(),
      rating: payload.rating,
      text: payload.text,
      verified: false,
      pros: payload.pros?.length ? payload.pros : null,
      cons: payload.cons?.length ? payload.cons : null,
      hasImage: images.length > 0,
      images: images.length ? images : null,
      helpfulCount: 0,
      recommend: payload.recommend ?? true,
    })

    const shop = await SellerShop.query().orderBy('id', 'asc').first()
    await SellerReview.updateOrCreate(
      { id: review.id },
      {
        id: review.id,
        shopId: shop?.id ?? 1,
        productId: review.productId,
        name: review.name,
        rating: review.rating,
        text: review.text,
        date: review.date,
        reply: null,
        moderation: 'pending',
      },
    )

    await refreshProductRating(product)

    return response.created({
      ...review.toJSON(),
      productStats: {
        rating: product.rating,
        reviews: product.reviews,
      },
    })
  }

  async questions({ params, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }
    const questions = await ProductQuestion.query()
      .where('product_id', product.id)
      .orderBy('created_at', 'desc')
    return response.ok(questions.map((q) => q.toJSON()))
  }

  async storeQuestion({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }

    const payload = await request.validateUsing(storeQuestionValidator)
    await user.load('profile')

    const question = await ProductQuestion.create({
      id: `q${Date.now()}`,
      productId: product.id,
      userId: user.id,
      name: displayName(user),
      date: jalaliishDate(),
      verified: false,
      question: payload.question,
      answer: null,
    })

    return response.created(question.toJSON())
  }
}
