import Product from '#models/product'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

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
    const sort = String(request.input('sort', 'relevant')) as (typeof SORTS)[number]
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const pageSize = Math.min(48, Math.max(1, Number(request.input('pageSize', 12)) || 12))

    let query = Product.query()

    if (category) query = query.where('category', category)
    if (brands.length) query = query.whereIn('brand', brands)
    if (minPrice > 0) query = query.where('price', '>=', minPrice)
    if (maxPrice > 0) query = query.where('price', '<=', maxPrice)
    if (onlyDiscount) query = query.whereNotNull('old_price')
    if (onlyInStock) query = query.where('in_stock', true)
    if (fastDelivery) query = query.where('fast_delivery', true)
    if (minRating > 0) query = query.where('rating', '>=', minRating)

    if (q) {
      const like = `%${q}%`
      query = query.where((builder) => {
        builder
          .whereILike('title', like)
          .orWhereILike('brand', like)
          .orWhereILike('category_label', like)
          .orWhereILike('short_name', like)
      })
    }

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
      items: items.map((p) => p.toCatalogJSON()),
      total,
      page,
      pageSize,
    })
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }
    product.viewCount += 1
    await product.save()
    return response.ok(product.toCatalogJSON())
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

  async storeReview({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }

    const validator = vine.compile(
      vine.object({
        rating: vine.number().min(1).max(5),
        text: vine.string().trim().minLength(3),
        pros: vine.array(vine.string().trim()).optional(),
        cons: vine.array(vine.string().trim()).optional(),
      })
    )
    const payload = await request.validateUsing(validator)
    await (user as any).load('profile')
    const name =
      [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim() ||
      'کاربر دیجی‌شاپ'

    const review = await ProductReview.create({
      id: `rev-${Date.now()}`,
      productId: product.id,
      name,
      date: new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      rating: payload.rating,
      text: payload.text,
      verified: true,
      pros: payload.pros?.length ? payload.pros : null,
      cons: payload.cons?.length ? payload.cons : null,
      hasImage: false,
      helpfulCount: 0,
    })

    product.reviews += 1
    await product.save()

    return response.created(review.toJSON())
  }

  async storeQuestion({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.find(params.id)
    if (!product) {
      return response.notFound({ errors: [{ field: 'id', message: 'محصول یافت نشد' }] })
    }

    const validator = vine.compile(
      vine.object({
        question: vine.string().trim().minLength(5),
      })
    )
    const payload = await request.validateUsing(validator)
    await (user as any).load('profile')
    const name =
      [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim() ||
      'کاربر دیجی‌شاپ'

    const question = await ProductQuestion.create({
      id: `q-${Date.now()}`,
      productId: product.id,
      name,
      date: new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      verified: true,
      question: payload.question,
      answer: null,
    })

    return response.created(question.toJSON())
  }
}
