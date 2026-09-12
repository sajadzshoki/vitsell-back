import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Category from '#models/category'
import Product from '#models/product'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'
import DiscountCode from '#models/discount_code'
import ContentBlock from '#models/content_block'
import ContentPromo from '#models/content_promo'
import BlogPost from '#models/blog_post'
import StaticPage from '#models/static_page'
import User from '#models/user'
import SellerShop from '#models/seller_shop'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'
import AmazingDeal from '#models/amazing_deal'
import { DateTime } from 'luxon'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedDir = join(__dirname, '../seed_data')

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(seedDir, name), 'utf8')) as T
}

export default class extends BaseSeeder {
  async run() {
    const categories = loadJson<
      {
        id: string
        name: string
        icon: string
        image?: string | null
        text?: string | null
        subs: { name: string; items: string[] }[]
        pageMeta: unknown
      }[]
    >('categories.json')

    for (const c of categories) {
      await Category.updateOrCreate(
        { id: c.id },
        {
          id: c.id,
          name: c.name,
          icon: c.icon,
          image: c.image ?? null,
          text: c.text ?? null,
          subs: c.subs ?? [],
          pageMeta: (c.pageMeta as any) ?? null,
          suggested: null,
        }
      )
    }

    const products = loadJson<
      {
        id: string
        title: string
        brand: string
        category: string
        categoryLabel: string
        price: number
        oldPrice?: number
        rating: number
        reviews: number
        image: string
        gallery?: string[]
        badge?: string
        colors?: { name: string; hex: string }[]
        inStock?: boolean
        fastDelivery?: boolean
        shortDesc?: string
        shortName?: string
        description?: string
        features?: string[]
        buyNotes?: { icon: string; text: string }[]
        scores?: Record<string, number>
        specs?: { key: string; value: string }[]
      }[]
    >('products.json')

    const existingProductCount = Number(
      ((await Product.query().count('* as total').first()) as any)?.$extras?.total ?? 0
    )
    const seedCatalog = existingProductCount === 0
    if (!seedCatalog) {
      console.log(
        `[seed] ${existingProductCount} products already present — skipping products/deals (preserves admin deletes)`
      )
    }

    if (seedCatalog) {
    for (const p of products) {
      const description =
        p.description ??
        `${p.shortDesc || p.title}\n\nاین محصول با گارانتی اصالت کالا از فروشگاه دیجی‌شاپ عرضه می‌شود.`
      const features =
        p.features ??
        (['گارانتی اصالت کالا', 'ارسال سریع', 'پشتیبانی تخصصی'].filter(Boolean) as string[])
      const buyNotes =
        p.buyNotes ??
        ([
          { icon: 'truck-delivery', text: 'ارسال سریع از انبار فروشنده' },
          { icon: 'refresh', text: '۷ روز ضمانت بازگشت کالا' },
          { icon: 'shield-check', text: 'تضمین اصالت کالا' },
        ] as { icon: string; text: string }[])

      await Product.updateOrCreate(
        { id: p.id },
        {
          id: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          categoryLabel: p.categoryLabel,
          price: p.price,
          oldPrice: p.oldPrice ?? null,
          rating: p.rating,
          reviews: p.reviews,
          image: p.image,
          gallery: p.gallery ?? null,
          badge: p.badge ?? null,
          colors: p.colors ?? null,
          inStock: p.inStock !== false,
          fastDelivery: !!p.fastDelivery,
          shortDesc: p.shortDesc ?? null,
          shortName: p.shortName ?? null,
          description,
          features,
          buyNotes,
          scores: p.scores ?? null,
          specs: p.specs ?? null,
          soldCount: 0,
          viewCount: 0,
        }
      )
    }

    {
      const now = DateTime.utc()
      const discounted = products.filter((p) => p.oldPrice && p.oldPrice > p.price).slice(0, 6)
      for (const [index, p] of discounted.entries()) {
        const discountPercent = Math.min(
          99,
          Math.max(1, Math.round((1 - p.price / p.oldPrice!) * 100))
        )
        await AmazingDeal.updateOrCreate(
          { id: `deal-${p.id}` },
          {
            id: `deal-${p.id}`,
            productId: p.id,
            discountPercent,
            startsAt: now.minus({ hours: 1 }),
            endsAt: now.plus({ hours: 48 }),
            active: index < 4,
          }
        )
      }
    }
    } // seedCatalog products + deals

    const featuredId = products[0]?.id ?? 'iphone-16-pro'
    const reviews = loadJson<any[]>('reviews.json')
    for (const r of reviews) {
      await ProductReview.updateOrCreate(
        { id: r.id },
        {
          id: r.id,
          productId: featuredId,
          name: r.name,
          date: r.date,
          rating: r.rating,
          text: r.text,
          verified: !!r.verified,
          pros: r.pros ?? null,
          cons: r.cons ?? null,
          hasImage: !!(r.hasImage || r.images?.length),
          images: Array.isArray(r.images) && r.images.length ? r.images : null,
          helpfulCount: r.helpfulCount ?? 0,
        }
      )
    }

    const questions = loadJson<any[]>('questions.json')
    for (const q of questions) {
      await ProductQuestion.updateOrCreate(
        { id: q.id },
        {
          id: q.id,
          productId: featuredId,
          name: q.name,
          date: q.date,
          verified: !!q.verified,
          question: q.question,
          answer: q.answer ?? null,
        }
      )
    }

    const content = loadJson<Record<string, unknown>>('content.json')
    for (const [key, value] of Object.entries(content)) {
      if (key === 'cartDiscountCodes') continue
      await ContentBlock.updateOrCreate({ key }, { key, value })
    }

    const codes = (content.cartDiscountCodes || {}) as Record<string, number>
    const codeNow = DateTime.utc()
    let codeIndex = 0
    for (const [code, percent] of Object.entries(codes)) {
      await DiscountCode.updateOrCreate(
        { code },
        {
          code,
          percent,
          active: true,
          startsAt: codeNow.minus({ days: 7 }),
          endsAt: codeNow.plus({ days: 60 }),
          minAmount: codeIndex === 0 ? 0 : 500_000,
          oncePerUser: code.startsWith('WELCOME'),
        }
      )
      codeIndex++
    }

    const homePromos = (content.homePromos || []) as Array<{
      id: string
      eyebrow?: string
      title: string
      subtitle: string
      tone?: string
      icon?: string
      primaryCta?: { label?: string; to?: string }
      secondaryCta?: { label?: string; to?: string }
    }>
    for (const promo of homePromos) {
      await ContentPromo.updateOrCreate(
        { id: promo.id },
        {
          id: promo.id,
          eyebrow: promo.eyebrow ?? '',
          title: promo.title,
          subtitle: promo.subtitle,
          tone: promo.tone === 'warning' ? 'warning' : 'primary',
          icon: promo.icon || 'sparkles',
          primaryCtaLabel: promo.primaryCta?.label ?? '',
          primaryCtaTo: promo.primaryCta?.to ?? null,
          secondaryCtaLabel: promo.secondaryCta?.label ?? null,
          secondaryCtaTo: promo.secondaryCta?.to ?? null,
          active: true,
        }
      )
    }

    const blog = loadJson<any[]>('blog.json')
    for (const post of blog) {
      await BlogPost.updateOrCreate(
        { id: post.id },
        {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          category: post.category,
          readTime: post.readTime,
          author: post.author,
          image: post.image,
          relatedCategories: post.relatedCategories ?? [],
          content: post.content ?? [],
          highlights: post.highlights ?? null,
        }
      )
    }

    const staticPages = loadJson<
      {
        id: string
        path: string
        title: string
        subtitle: string
        icon: string
        sections: unknown[]
      }[]
    >('static-pages.json')
    for (const page of staticPages) {
      await StaticPage.updateOrCreate(
        { id: page.id },
        {
          id: page.id,
          path: page.path,
          title: page.title,
          subtitle: page.subtitle,
          icon: page.icon,
          sections: page.sections ?? [],
        }
      )
    }

    const seller = loadJson<{
      shop: any
      listings: any[]
      orders: any[]
      reviews: any[]
      payouts: any[]
      sales: any[]
    }>('seller.json')

    const admin = await User.query().where('role', 'admin').orderBy('id', 'asc').first()
    if (!admin) {
      console.warn(
        '[seed] No admin user — skipping seller demo data. Create an admin account manually (role=admin).'
      )
    }
    else {
      const shop = await SellerShop.updateOrCreate(
        { slug: 'digishop' },
        {
          userId: admin.id,
          name: seller.shop.name,
          slug: 'digishop',
          phone: seller.shop.phone,
          email: seller.shop.email,
          city: seller.shop.city,
          about: seller.shop.about,
          rating: seller.shop.rating,
          reviewCount: seller.shop.reviewCount,
          joinDate: seller.shop.joinDate,
        }
      )

    for (const listing of seller.listings) {
      const exists = await Product.find(listing.productId)
      if (!exists) continue
      // firstOrCreate: never resurrect listings the admin deleted
      await SellerListing.firstOrCreate(
        { shopId: shop.id, productId: listing.productId },
        {
          shopId: shop.id,
          productId: listing.productId,
          stock: listing.stock,
          sold: listing.sold,
          views: listing.views,
          status: listing.status,
        }
      )
    }

    for (const order of seller.orders) {
      await SellerOrder.updateOrCreate(
        { id: order.id },
        {
          id: order.id,
          shopId: shop.id,
          date: order.date,
          dateKey: order.dateKey,
          status: order.status,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          city: order.city,
          address: order.address,
          items: order.items,
          total: order.total,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          note: order.note ?? null,
        }
      )
    }

    for (const review of seller.reviews) {
      const exists = await Product.find(review.productId)
      if (!exists) continue
      await SellerReview.updateOrCreate(
        { id: review.id },
        {
          id: review.id,
          shopId: shop.id,
          productId: review.productId,
          name: review.name,
          rating: review.rating,
          text: review.text,
          date: review.date,
          reply: review.reply ?? null,
        }
      )
    }

    for (const payout of seller.payouts) {
      await SellerPayout.updateOrCreate(
        { id: payout.id },
        {
          id: payout.id,
          shopId: shop.id,
          date: payout.date,
          amount: payout.amount,
          status: payout.status,
        }
      )
    }

    await ContentBlock.updateOrCreate(
      { key: `sellerSales:${shop.id}` },
      { key: `sellerSales:${shop.id}`, value: seller.sales }
    )
    await ContentBlock.updateOrCreate(
      { key: 'siteSales' },
      { key: 'siteSales', value: seller.sales }
    )
    }

    const siteSettingsRow = await ContentBlock.find('siteSettings')
    if (!siteSettingsRow) {
      await ContentBlock.create({
        key: 'siteSettings',
        value: {
          name: 'دیجی‌شاپ',
          slug: 'digishop',
          phone: '',
          email: 'info@digishop.ir',
          city: 'تهران',
          about:
            'دیجی‌شاپ بزرگ‌ترین فروشگاه اینترنتی محصولات دیجیتال با گارانتی اصالت کالا و ارسال سریع به سراسر ایران.',
          rating: seller.shop.rating,
          reviewCount: seller.shop.reviewCount,
          joinDate: seller.shop.joinDate,
        },
      })
    }
  }
}
