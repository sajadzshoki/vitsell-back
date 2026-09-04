import ContentBlock from '#models/content_block'
import Product from '#models/product'
import BlogPost from '#models/blog_post'
import Banner from '#models/banner'
import StaticPage from '#models/static_page'
import AmazingDeal from '#models/amazing_deal'
import ContentPromo from '#models/content_promo'
import DiscountCode from '#models/discount_code'
import { applyDealToCatalog } from '#utils/deals'
import { loadAboutPage } from '#utils/about_page'
import { loadFooterWithSiteOverlay, loadSiteSettings } from '#utils/site_settings'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

async function block<T>(key: string, fallback: T): Promise<T> {
  const row = await ContentBlock.find(key)
  return (row?.value as T) ?? fallback
}

export default class ContentController {
  async home({ response }: HttpContext) {
    const now = DateTime.utc()
    const heroBanners = await Banner.query()
      .where('placement', 'homepage_hero')
      .where('active', true)
      .orderBy('priority', 'asc')
      .orderBy('sort_order', 'asc')

    const liveHeroes = heroBanners.filter((b) => b.isLive(now))
    const [legacyHeroSlides, heroFeatures, brands, circles, legacyPromos] = await Promise.all([
      block('heroSlides', []),
      block('heroFeatures', []),
      block('homeBrands', []),
      block('homeCircles', []),
      block('homePromos', []),
    ])

    const heroSlides = liveHeroes.length
      ? liveHeroes.map((b) => b.toHeroSlideJSON())
      : legacyHeroSlides

    const promoRows = await ContentPromo.query().where('active', true).orderBy('created_at', 'desc')
    const promos = promoRows.length
      ? promoRows.map((p) => p.toPublicJSON())
      : legacyPromos

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

  async about({ response }: HttpContext) {
    const about = await loadAboutPage()
    if (!about) {
      return response.notFound({
        errors: [{ field: 'about', message: 'صفحه درباره ما یافت نشد' }],
      })
    }
    return response.ok(about)
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
    const now = DateTime.utc()
    return response.ok(
      posts.filter((p) => p.isPubliclyVisible(now)).map((p) => p.toPublicJSON())
    )
  }

  async blogShow({ params, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post || !post.isPubliclyVisible()) {
      return response.notFound({ errors: [{ field: 'id', message: 'مقاله یافت نشد' }] })
    }
    return response.ok(post.toPublicJSON())
  }

  async staticPage({ params, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page || page.status === 'draft' || page.status === 'archived') {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }
    return response.ok(page.toPublicJSON())
  }
}
