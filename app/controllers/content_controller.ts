import ContentBlock from '#models/content_block'
import Product from '#models/product'
import BlogPost from '#models/blog_post'
import StaticPage from '#models/static_page'
import type { HttpContext } from '@adonisjs/core/http'

async function block<T>(key: string, fallback: T): Promise<T> {
  const row = await ContentBlock.find(key)
  return (row?.value as T) ?? fallback
}

export default class ContentController {
  async home({ response }: HttpContext) {
    const [heroSlides, heroFeatures, brands, circles, promos] = await Promise.all([
      block('heroSlides', []),
      block('heroFeatures', []),
      block('homeBrands', []),
      block('homeCircles', []),
      block('homePromos', []),
    ])

    const deals = await Product.query()
      .whereNotNull('old_price')
      .orderBy('rating', 'desc')
      .limit(6)
    const bestSellers = await Product.query().orderBy('sold_count', 'desc').limit(8)
    const newArrivals = await Product.query().orderBy('created_at', 'desc').limit(8)

    return response.ok({
      heroSlides,
      heroFeatures,
      brands,
      circles,
      promos,
      dealsOfTheDay: deals.map((p) => p.toCatalogJSON()),
      bestSellers: bestSellers.map((p) => p.toCatalogJSON()),
      newArrivals: newArrivals.map((p) => p.toCatalogJSON()),
    })
  }

  async locations({ response }: HttpContext) {
    const citiesByProvince = await block<Record<string, string[]>>('citiesByProvince', {})
    return response.ok(citiesByProvince)
  }

  async compareTemplates({ params, response }: HttpContext) {
    const templates = await block<Record<string, unknown>>('compareTemplates', {})
    const radar = await block<Record<string, string[]>>('radarCriteriaByCategory', {})
    return response.ok({
      sections: templates[params.category] ?? [],
      radarCriteria: radar[params.category] ?? [],
    })
  }

  async footer({ response }: HttpContext) {
    return response.ok({
      trustItems: await block('footerTrustItems', []),
      columns: await block('footerColumns', []),
      socials: await block('footerSocials', []),
      about: await block(
        'footerAbout',
        'دیجی‌شاپ بزرگ‌ترین فروشگاه اینترنتی محصولات دیجیتال با گارانتی اصالت کالا و ارسال سریع به سراسر ایران.',
      ),
      copyright: await block(
        'footerCopyright',
        '© ۱۴۰۵ فروشگاه اینترنتی دیجی‌شاپ. تمامی حقوق محفوظ است.',
      ),
    })
  }

  async discountCodes({ response }: HttpContext) {
    const DiscountCode = (await import('#models/discount_code')).default
    const rows = await DiscountCode.query().where('active', true)
    const map: Record<string, number> = {}
    for (const row of rows) {
      map[row.code] = Number(row.percent)
    }
    return response.ok(map)
  }

  async blogIndex({ response }: HttpContext) {
    const posts = await BlogPost.query().orderBy('created_at', 'desc')
    return response.ok(posts.map((p) => p.toJSON()))
  }

  async blogShow({ params, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) {
      return response.notFound({ errors: [{ field: 'id', message: 'مقاله یافت نشد' }] })
    }
    return response.ok(post.toJSON())
  }

  async staticPage({ params, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page) {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }
    return response.ok(page.toJSON())
  }
}
