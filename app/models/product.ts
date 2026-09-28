import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'
import type { SeoMeta } from '#models/blog_post'
import { toPublicMediaUrl } from '#utils/media_upload'

export type ProductColor = { name: string; hex: string }
export type ProductSpec = { key: string; value: string; group?: string }

export function normalizeImageAlts(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const out: Record<string, string> = {}
  for (const [key, alt] of Object.entries(value as Record<string, unknown>)) {
    const url = key.trim()
    const text = String(alt ?? '').trim().slice(0, 300)
    if (!url || !text) continue
    out[url] = text
  }
  return Object.keys(out).length ? out : null
}

function publicImageAlts(alts: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [url, alt] of Object.entries(alts)) {
    const stored = url.trim()
    const text = String(alt || '').trim()
    if (!stored || !text) continue
    const publicUrl = toPublicMediaUrl(stored) || stored
    out[stored] = text
    out[publicUrl] = text
  }
  return out
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

export default class Product extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare brand: string

  @column()
  declare category: string

  @column()
  declare categoryLabel: string

  @column()
  declare price: number

  @column()
  declare oldPrice: number | null

  @column()
  declare rating: number

  @column()
  declare reviews: number

  @column()
  declare image: string

  @column()
  declare imageDark: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare gallery: string[] | null

  @column({
    prepare: (value: Record<string, string> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: Record<string, string> | string | null) => {
      if (!value) return null
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      return normalizeImageAlts(parsed)
    },
  })
  declare imageAlts: Record<string, string> | null

  @column()
  declare badge: string | null

  @column({
    prepare: (value: ProductColor[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: ProductColor[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare colors: ProductColor[] | null

  @column()
  declare inStock: boolean

  @column()
  declare fastDelivery: boolean

  @column()
  declare shortDesc: string | null

  @column()
  declare shortName: string | null

  @column({
    prepare: (value: Record<string, number> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: Record<string, number> | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare scores: Record<string, number> | null

  @column({
    prepare: (value: ProductSpec[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: ProductSpec[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare specs: ProductSpec[] | null

  @column()
  declare soldCount: number

  @column()
  declare viewCount: number

  @column()
  declare featured: boolean

  @column()
  declare published: boolean

  @column()
  declare hasVariants: boolean

  @column()
  declare sku: string | null

  @column()
  declare barcode: string | null

  @column()
  declare weight: string | null

  @column()
  declare lowStockThreshold: number

  @column({
    prepare: (value: unknown[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare variantAxes: unknown[] | null

  @column({
    prepare: (value: unknown[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare variants: unknown[] | null

  @column()
  declare description: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare features: string[] | null

  @column({
    prepare: (value: Array<{ icon: string; text: string }> | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: Array<{ icon: string; text: string }> | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare buyNotes: Array<{ icon: string; text: string }> | null

  @column({
    prepare: (value: SeoMeta | null) => (value ? JSON.stringify(value) : null),
    consume: (value: SeoMeta | string | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return { ...emptySeo(), ...JSON.parse(value) }
        } catch {
          return emptySeo()
        }
      }
      return { ...emptySeo(), ...value }
    },
  })
  declare seo: SeoMeta | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : '[]'),
    consume: (value: string[] | string | null) => {
      if (!value) return []
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare tags: string[]

  @column()
  declare source: string | null

  @column()
  declare sourceUrl: string | null

  @column()
  declare sourceProductId: string | null

  @column.dateTime()
  declare sourceImportedAt: DateTime | null

  @column.dateTime()
  declare sourceUpdatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category, { foreignKey: 'category' })
  declare categoryRelation: BelongsTo<typeof Category>

  @hasMany(() => ProductReview)
  declare productReviews: HasMany<typeof ProductReview>

  @hasMany(() => ProductQuestion)
  declare productQuestions: HasMany<typeof ProductQuestion>

  /** Frontend Product shape */
  toCatalogJSON() {
    const gallery = (this.gallery || [])
      .map((url) => toPublicMediaUrl(String(url || '').trim()))
      .filter(Boolean)
    const variants = Array.isArray(this.variants)
      ? this.variants.map((variant) => {
          const row = variant as Record<string, unknown>
          const image = typeof row.image === 'string' ? row.image.trim() : ''
          return image
            ? { ...row, image: toPublicMediaUrl(image) }
            : row
        })
      : []

    return {
      id: this.id,
      title: this.title,
      brand: this.brand,
      category: this.category,
      categoryLabel: this.categoryLabel,
      price: Number(this.price),
      ...(this.oldPrice !== null ? { oldPrice: Number(this.oldPrice) } : {}),
      rating: this.rating,
      reviews: this.reviews,
      image: toPublicMediaUrl(this.image),
      ...(this.imageDark ? { imageDark: toPublicMediaUrl(this.imageDark) } : {}),
      ...(gallery.length ? { gallery } : {}),
      ...(this.imageAlts ? { imageAlts: publicImageAlts(this.imageAlts) } : {}),
      ...(this.badge ? { badge: this.badge } : {}),
      ...(this.colors?.length ? { colors: this.colors } : {}),
      inStock: this.inStock,
      fastDelivery: this.fastDelivery,
      featured: Boolean(this.featured),
      published: this.published !== false,
      hasVariants: Boolean(this.hasVariants),
      sku: this.sku || '',
      barcode: this.barcode || '',
      weight: this.weight || '',
      lowStockThreshold: Number(this.lowStockThreshold) || 5,
      variantAxes: Array.isArray(this.variantAxes) ? this.variantAxes : [],
      variants,
      ...(this.shortDesc ? { shortDesc: this.shortDesc } : {}),
      ...(this.shortName ? { shortName: this.shortName } : {}),
      ...(this.scores ? { scores: this.scores } : {}),
      ...(this.specs?.length ? { specs: this.specs } : {}),
      ...(this.description ? { description: this.description } : {}),
      ...(this.features?.length ? { features: this.features } : {}),
      ...(this.buyNotes?.length ? { buyNotes: this.buyNotes } : {}),
      seo: this.seo
        ? {
            ...emptySeo(),
            ...this.seo,
            ...(this.seo.ogImage ? { ogImage: toPublicMediaUrl(this.seo.ogImage) } : {}),
            ...(this.seo.twitterImage ? { twitterImage: toPublicMediaUrl(this.seo.twitterImage) } : {}),
          }
        : null,
      tags: Array.isArray(this.tags) ? this.tags : [],
    }
  }
}
