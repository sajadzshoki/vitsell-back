import ContentBlock from '#models/content_block'
import Product from '#models/product'
import BlogPost from '#models/blog_post'
import StaticPage from '#models/static_page'
import AmazingDeal from '#models/amazing_deal'
import ContentPromo from '#models/content_promo'
import DiscountCode from '#models/discount_code'
import { applyDealToCatalog } from '#utils/deals'
import { loadFooterWithSiteOverlay, loadSiteSettings } from '#utils/site_settings'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

async function block<T>(key: string, fallback: T): Promise<T> {
  const row = await ContentBlock.find(key)
  return (row?.value as T) ?? fallback
}

export default class ContentController {
  async home({ response }: HttpContext) {
    const [heroSlides, heroFeatures, brands, circles, legacyPromos] = await Promise.all([
      block('heroSlides', []),
      block('heroFeatures', []),
      block('homeBrands', []),
      block('homeCircles', []),
      block('homePromos', []),
    ])

    const promoRows = await ContentPromo.query().where('active', true).orderBy('created_at', 'desc')
    const promos = promoRows.length
      ? promoRows.map((p) => p.toPublicJSON())
      : legacyPromos

    const now = DateTime.utc()
    const liveDeals = await AmazingDeal.query()
      .where('active', true)
      .where('starts_at', '<=', now.toSQL()!)
      .where('ends_at', '>=', now.toSQL()!)
      .orderBy('created_at', 'desc')
      .limit(12)

    let dealsOfTheDay: ReturnType<typeof applyDealToCatalog>[] = []
    if (liveDeals.length) {
      const productIds = liveDeals.map((d) => d.productId)
      const products = await Product.query().whereIn('id', productIds)
      const byId = new Map(products.map((p) => [p.id, p]))
      dealsOfTheDay = liveDeals
        .map((deal) => {
          const product = byId.get(deal.productId)
          if (!product) return null
          return applyDealToCatalog(product, deal.discountPercent)
        })
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 6)
    }

    // Fallback: products that already have oldPrice (legacy seed)
    if (!dealsOfTheDay.length) {
      const deals = await Product.query()
        .whereNotNull('old_price')
        .orderBy('rating', 'desc')
        .limit(6)
      dealsOfTheDay = deals.map((p) => p.toCatalogJSON() as ReturnType<typeof applyDealToCatalog>)
    }

    const bestSellers = await Product.query().orderBy('sold_count', 'desc').limit(8)
    const newArrivals = await Product.query().orderBy('created_at', 'desc').limit(8)

    return response.ok({
      heroSlides,
      heroFeatures,
      brands,
      circles,
      promos,
      dealsOfTheDay,
      bestSellers: bestSellers.map((p) => p.toCatalogJSON()),
      newArrivals: newArrivals.map((p) => p.toCatalogJSON()),
    })
  }

  async site({ response }: HttpContext) {
    return response.ok(await loadSiteSettings())
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
    return response.ok(await loadFooterWithSiteOverlay())
  }

  async discountCodes({ response }: HttpContext) {
    const now = DateTime.utc()
    const rows = await DiscountCode.query().where('active', true)
    const map: Record<string, number> = {}
    for (const row of rows) {
      if (!row.isLive(now)) continue
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
