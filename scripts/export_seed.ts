/**
 * Export digishop-front mock data → digishop-back/database/seed_data
 * Run from digishop-front: npx tsx ../digishop-back/scripts/export_seed.ts
 * Or from digishop-back with path aliases via tsx in front cwd.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { products, categoryLabels } from '../../digishop-front/app/data/products.ts'
import { categories } from '../../digishop-front/app/data/categories.ts'
import { categoryPageMeta } from '../../digishop-front/app/data/category-pages.ts'
import { productMockReviews, productMockQuestions } from '../../digishop-front/app/data/product-detail.ts'
import { heroSlides, heroFeatures } from '../../digishop-front/app/data/hero.ts'
import { homeBrands, homeCircleItems, homePromos } from '../../digishop-front/app/data/home.ts'
import { cartDiscountCodes } from '../../digishop-front/app/data/cart.ts'
import { citiesByProvince } from '../../digishop-front/app/data/iran-locations.ts'
import { compareTemplates, radarCriteriaByCategory } from '../../digishop-front/app/data/compare.ts'
import {
  footerTrustItems,
  footerColumns,
  footerSocials,
  footerAbout,
  footerCopyright,
  footerContact,
  footerAppStores,
  footerBadges,
} from '../../digishop-front/app/data/footer.ts'
import {
  defaultSellerShop,
  defaultSellerListings,
  defaultSellerOrders,
  defaultSellerReviews,
  defaultSellerPayouts,
  defaultSellerSales,
} from '../../digishop-front/app/data/seller.ts'
import { blogPosts } from '../../digishop-front/app/data/static-pages.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../database/seed_data')
mkdirSync(outDir, { recursive: true })

function write(name: string, data: unknown) {
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2), 'utf8')
  console.log('wrote', name)
}

write(
  'categories.json',
  categories.map((c) => ({
    ...c,
    pageMeta: categoryPageMeta[c.id] ?? null,
  })),
)

write(
  'products.json',
  products.map((p) => ({
    ...p,
    categoryLabel: p.categoryLabel || categoryLabels[p.category] || p.category,
  })),
)

write('reviews.json', productMockReviews)
write('questions.json', productMockQuestions)

write('content.json', {
  heroSlides,
  heroFeatures,
  homeBrands: [...homeBrands],
  homeCircles: homeCircleItems,
  homePromos,
  citiesByProvince,
  compareTemplates,
  radarCriteriaByCategory,
  footerTrustItems,
  footerColumns,
  footerSocials,
  footerAbout,
  footerCopyright,
  footerContact,
  footerAppStores,
  footerBadges,
  categoryLabels,
  cartDiscountCodes,
})

write('blog.json', blogPosts)

write('seller.json', {
  shop: defaultSellerShop,
  listings: defaultSellerListings,
  orders: defaultSellerOrders,
  reviews: defaultSellerReviews,
  payouts: defaultSellerPayouts,
  sales: defaultSellerSales,
})

console.log('seed_data ready at', outDir)
