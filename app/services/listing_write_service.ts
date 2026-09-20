import { DateTime } from 'luxon'
import Product from '#models/product'
import Category from '#models/category'
import SellerShop from '#models/seller_shop'
import SellerListing from '#models/seller_listing'
import User from '#models/user'
import { upsertCategorySpecKeys } from '#models/category_spec_key'
import { defaultSiteSettings } from '#utils/site_settings'
import type { SeoMeta } from '#models/blog_post'

export type ListingProductInput = {
  id?: string
  title: string
  shortName?: string | null
  brand?: string
  category: string
  categoryLabel: string
  price: number
  oldPrice?: number | null
  image: string
  imageDark?: string | null
  gallery?: string[] | null
  colors?: Array<{ name: string; hex: string }> | null
  shortDesc?: string | null
  description?: string | null
  features?: string[] | null
  specs?: Array<{ key: string; value: string; group?: string }> | null
  badge?: string | null
  inStock?: boolean
  fastDelivery?: boolean
  featured?: boolean
  published?: boolean
  hasVariants?: boolean
  sku?: string | null
  barcode?: string | null
  weight?: string | null
  lowStockThreshold?: number
  variantAxes?: unknown[] | null
  variants?: unknown[] | null
  seo?: Partial<SeoMeta> | null
  tags?: string[]
  source?: string | null
  sourceUrl?: string | null
  sourceProductId?: string | null
  sourceImportedAt?: DateTime | null
  sourceUpdatedAt?: DateTime | null
}

export type ListingWriteResult = {
  product: Product
  listing: SellerListing
  created: boolean
}

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

function emptySeo(): SeoMeta {
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

function normalizeProductSeo(input?: Partial<SeoMeta> | null): SeoMeta | null {
  if (!input) return null
  const next = { ...emptySeo(), ...input }
  const hasAny = Object.entries(next).some(([key, value]) => {
    if (key === 'robots') return value !== 'index,follow'
    return Boolean(String(value || '').trim())
  })
  return hasAny ? next : null
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

export async function assertActiveCategory(categoryId: string) {
  const cat = await Category.find(categoryId.trim())
  if (!cat) throw new Error('دسته‌بندی انتخاب‌شده یافت نشد')
  if (cat.status === 'inactive') throw new Error('دسته‌بندی غیرفعال است')
  return cat
}

/**
 * Shared create/update path used by Technolife importer (mirrors seller listing rules).
 */
export default class ListingWriteService {
  async createListing(input: {
    product: ListingProductInput
    stock: number
    status?: 'active' | 'pending' | 'inactive' | 'out_of_stock'
  }): Promise<ListingWriteResult> {
    const p = input.product
    await assertActiveCategory(p.category)
    const id =
      p.id?.trim() || `p-${slugify(p.shortName || p.title)}-${Date.now().toString().slice(-5)}`

    const existingProduct = await Product.find(id)
    const now = DateTime.now()

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
        rating: existingProduct?.rating ?? 0,
        reviews: existingProduct?.reviews ?? 0,
        image: p.image,
        imageDark: p.imageDark ?? null,
        gallery: p.gallery?.length ? p.gallery : null,
        badge: p.badge || null,
        colors: p.colors?.length ? p.colors : null,
        inStock: p.inStock ?? input.stock > 0,
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
        scores: existingProduct?.scores ?? null,
        soldCount: existingProduct?.soldCount ?? 0,
        viewCount: existingProduct?.viewCount ?? 0,
        source: p.source ?? existingProduct?.source ?? null,
        sourceUrl: p.sourceUrl ?? existingProduct?.sourceUrl ?? null,
        sourceProductId: p.sourceProductId ?? existingProduct?.sourceProductId ?? null,
        sourceImportedAt: p.sourceImportedAt ?? existingProduct?.sourceImportedAt ?? now,
        sourceUpdatedAt: p.sourceUpdatedAt ?? now,
      }
    )

    await upsertCategorySpecKeys(product.category, product.specs)

    const status = input.status ?? (input.stock > 0 ? 'pending' : 'out_of_stock')
    const siteShop = await resolveSiteShop()
    const existing = await SellerListing.query().where('product_id', product.id).first()
    let listing: SellerListing
    let created = false
    if (existing) {
      existing.stock = input.stock
      existing.status = status
      await existing.save()
      listing = existing
    } else {
      listing = await SellerListing.create({
        shopId: siteShop.id,
        productId: product.id,
        stock: input.stock,
        sold: 0,
        views: 0,
        status,
      })
      created = true
    }

    return { product, listing, created: !existingProduct || created }
  }

  async updateListing(
    productId: string,
    input: {
      product?: Partial<ListingProductInput>
      stock?: number
      status?: 'active' | 'pending' | 'inactive' | 'out_of_stock'
    }
  ): Promise<ListingWriteResult> {
    const listing = await SellerListing.query().where('product_id', productId).first()
    if (!listing) throw new Error('محصول یافت نشد')

    let product = await Product.findOrFail(productId)

    if (input.product) {
      const p = input.product
      if (p.category) await assertActiveCategory(p.category)

      product.merge({
        ...(p.title != null ? { title: p.title } : {}),
        ...(p.brand != null ? { brand: p.brand } : {}),
        ...(p.category != null ? { category: p.category } : {}),
        ...(p.categoryLabel != null ? { categoryLabel: p.categoryLabel } : {}),
        ...(p.price != null ? { price: p.price } : {}),
        ...(p.oldPrice !== undefined ? { oldPrice: p.oldPrice } : {}),
        ...(p.image != null ? { image: p.image } : {}),
        ...(p.imageDark !== undefined ? { imageDark: p.imageDark } : {}),
        ...(p.gallery !== undefined ? { gallery: p.gallery?.length ? p.gallery : null } : {}),
        ...(p.colors !== undefined ? { colors: p.colors?.length ? p.colors : null } : {}),
        ...(p.shortDesc !== undefined ? { shortDesc: p.shortDesc } : {}),
        ...(p.shortName !== undefined ? { shortName: p.shortName } : {}),
        ...(p.description !== undefined ? { description: p.description } : {}),
        ...(p.features !== undefined ? { features: p.features?.length ? p.features : null } : {}),
        ...(p.specs !== undefined ? { specs: p.specs?.length ? p.specs : null } : {}),
        ...(p.sku !== undefined ? { sku: p.sku?.trim() || null } : {}),
        ...(p.hasVariants !== undefined ? { hasVariants: Boolean(p.hasVariants) } : {}),
        ...(p.variantAxes !== undefined
          ? { variantAxes: Array.isArray(p.variantAxes) && p.variantAxes.length ? p.variantAxes : null }
          : {}),
        ...(p.variants !== undefined
          ? { variants: Array.isArray(p.variants) && p.variants.length ? p.variants : null }
          : {}),
        ...(p.tags !== undefined ? { tags: p.tags } : {}),
        ...(p.source != null ? { source: p.source } : {}),
        ...(p.sourceUrl != null ? { sourceUrl: p.sourceUrl } : {}),
        ...(p.sourceProductId != null ? { sourceProductId: p.sourceProductId } : {}),
        sourceUpdatedAt: DateTime.now(),
      })
      await product.save()
      if (product.specs) await upsertCategorySpecKeys(product.category, product.specs)
    }

    if (input.stock != null) listing.stock = input.stock
    if (input.status != null) listing.status = input.status
    if (input.status === 'out_of_stock') listing.stock = 0
    product.inStock = listing.stock > 0 && listing.status !== 'out_of_stock'
    await product.save()
    await listing.save()

    return { product, listing, created: false }
  }
}
