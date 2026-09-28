import ContentBlock from '#models/content_block'
import Product from '#models/product'
import BlogPost from '#models/blog_post'
import Banner from '#models/banner'
import Brand from '#models/brand'
import Category from '#models/category'
import StaticPage from '#models/static_page'
import AmazingDeal from '#models/amazing_deal'
import ContentPromo from '#models/content_promo'
import DiscountCode from '#models/discount_code'
import { applyDealToCatalog } from '#utils/deals'
import { loadAboutPage } from '#utils/about_page'
import { loadPublicSiteProfile } from '#utils/platform_settings'
import { loadPublicNavigation } from '#utils/navigation_settings'
import { loadTopStripSettings } from '#utils/top_strip'
import { loadFooterWithSiteOverlay } from '#utils/site_settings'
import { loadSeoSettings } from '#utils/seo_settings'
import { loadSeoRedirects } from '#utils/seo_redirects'
import { productsToCatalogWithStock, stockByProductIds } from '#utils/catalog_stock'
import { resolveCategoryTreeIds } from '#utils/catalog_filters'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

async function block<T>(key: string, fallback: T): Promise<T> {
  const row = await ContentBlock.find(key)
  return (row?.value as T) ?? fallback
}

function chunkBannerRows(items: ReturnType<Banner['toHomeBannerJSON']>[], size = 3) {
  const rows: { id: string; items: typeof items }[] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push({
      id: `promo-row-${Math.floor(i / size) + 1}`,
      items: items.slice(i, i + size),
    })
  }
  return rows
}

export default class ContentController {
  async home({ response }: HttpContext) {
    const now = DateTime.utc()
    const [heroBanners, promoBanners] = await Promise.all([
      Banner.query()
        .where('placement', 'homepage_hero')
        .where('active', true)
        .orderBy('priority', 'asc')
        .orderBy('sort_order', 'asc'),
      Banner.query()
        .where('placement', 'homepage_promo_strip')
        .where('active', true)
        .orderBy('priority', 'asc')
        .orderBy('sort_order', 'asc'),
    ])

    const liveHeroes = heroBanners.filter((b) => b.isLive(now))
    const livePromoBanners = promoBanners.filter((b) => b.isLive(now))

    const [legacyHeroSlides, heroFeatures, legacyBrands, circles, legacyPromos] = await Promise.all([
      block('heroSlides', []),
      block('heroFeatures', []),
      block<string[]>('homeBrands', []),
      block('homeCircles', []),
      block('homePromos', []),
    ])

    const heroSlides = liveHeroes.length
      ? liveHeroes.map((b) => b.toHeroSlideJSON())
      : legacyHeroSlides

    const bannerRows = chunkBannerRows(livePromoBanners.map((b) => b.toHomeBannerJSON()))

    const promoRows = await ContentPromo.query().where('active', true).orderBy('created_at', 'desc')
    const promos = promoRows.length
      ? promoRows.map((p) => p.toPublicJSON())
      : legacyPromos

    const activeBrands = await Brand.query()
      .where('status', 'active')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')

    const brands = activeBrands.length
      ? activeBrands.map((b) => b.name)
      : legacyBrands

    const liveDeals = await AmazingDeal.query()
      .where('active', true)
      .where('starts_at', '<=', now.toSQL()!)
      .where('ends_at', '>=', now.toSQL()!)
      .orderBy('created_at', 'desc')
      .limit(12)

    let dealsOfTheDay: Array<ReturnType<typeof applyDealToCatalog> & { stock: number }> = []
    if (liveDeals.length) {
      const productIds = liveDeals.map((d) => d.productId)
      const products = await Product.query().whereIn('id', productIds)
      const byId = new Map(products.map((p) => [p.id, p]))
      const stocks = await stockByProductIds(productIds)
      dealsOfTheDay = liveDeals
        .map((deal) => {
          const product = byId.get(deal.productId)
          if (!product) return null
          return {
            ...applyDealToCatalog(product, deal.discountPercent),
            stock: stocks.get(deal.productId) ?? 0,
          }
        })
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 6)
    }

    if (!dealsOfTheDay.length) {
      const deals = await Product.query()
        .whereNotNull('old_price')
        .orderBy('rating', 'desc')
        .limit(6)
      dealsOfTheDay = await productsToCatalogWithStock(deals) as typeof dealsOfTheDay
    }

    const bestSellers = await productsToCatalogWithStock(
      await Product.query().orderBy('sold_count', 'desc').limit(8),
    )
    const newArrivals = await productsToCatalogWithStock(
      await Product.query().orderBy('created_at', 'desc').limit(8),
    )

    const rootCategories = await Category.query()
      .where('status', 'active')
      .whereNull('parent_id')
      .orderBy('sort_order', 'asc')
      .limit(20)

    const categoryShelves: {
      id: string
      title: string
      category: string
      viewAllTo: string
      products: Awaited<ReturnType<typeof productsToCatalogWithStock>>
    }[] = []

    for (const cat of rootCategories) {
      const treeIds = await resolveCategoryTreeIds(cat.id)
      const shelfProducts = await Product.query()
        .whereIn('category', treeIds.length ? treeIds : [cat.id])
        .orderBy('sold_count', 'desc')
        .limit(12)
      if (shelfProducts.length < 1) continue
      categoryShelves.push({
        id: `shelf-${cat.id}`,
        title: `پرفروش‌ترین‌های ${cat.name}`,
        category: cat.id,
        viewAllTo: `/search/category-${encodeURIComponent(cat.id)}`,
        products: await productsToCatalogWithStock(shelfProducts),
      })
      if (categoryShelves.length >= 3) break
    }

    const brandByName = new Map(activeBrands.map((b) => [b.name.trim().toLowerCase(), b]))
    const topMobileBrands: {
      id: string
      name: string
      image: string
      to: string
    }[] = []

    const mobileShelf =
      categoryShelves.find((s) => /mobile|موبایل|گوشی/i.test(s.category) || /موبایل|گوشی/i.test(s.title))
      || categoryShelves[0]

    if (mobileShelf) {
      const seen = new Set<string>()
      for (const product of mobileShelf.products) {
        const brandName = String(product.brand || '').trim()
        if (!brandName) continue
        const key = brandName.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        const brand = brandByName.get(key)
        const image = brand?.logo || String(product.image || '')
        if (!image) continue
        topMobileBrands.push({
          id: brand?.id || key,
          name: brand?.name || brandName,
          image,
          to: `/search/category-${encodeURIComponent(mobileShelf.category)}?brands=${encodeURIComponent(brand?.name || brandName)}`,
        })
        if (topMobileBrands.length >= 5) break
      }
    }

    return response.ok({
      heroSlides,
      heroFeatures,
      brands,
      circles,
      promos,
      bannerRows,
      categoryShelves,
      topMobileBrands,
      dealsOfTheDay,
      bestSellers,
      newArrivals,
    })
  }

  async site({ response }: HttpContext) {
    return response.ok(await loadPublicSiteProfile())
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

  async navigation({ response }: HttpContext) {
    return response.ok(await loadPublicNavigation())
  }

  async topStrip({ response }: HttpContext) {
    return response.ok(await loadTopStripSettings())
  }

  /** Public storefront SEO defaults (no auth). */
  async seo({ response }: HttpContext) {
    return response.ok(await loadSeoSettings())
  }

  /** Public active redirects only (no auth). */
  async seoRedirects({ response }: HttpContext) {
    const items = (await loadSeoRedirects()).filter((r) => r.active)
    return response.ok({ items })
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
