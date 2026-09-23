import { toPublicMediaUrl } from '#utils/media_upload'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { SeoMeta } from '#models/blog_post'
import Product from '#models/product'

export type CategoryStatus = 'active' | 'inactive'

export type CategorySub = {
  name: string
  items: string[]
  image?: string | null
}

export type CategoryPageMeta = {
  hero: {
    image: string
    eyebrow: string
    title: string
    subtitle: string
  }
  seo: {
    heading: string
    paragraphs: string[]
  }
}

export type CategorySuggestedItem = {
  id: string
  title: string
  image: string
  query: string
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

export default class Category extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare icon: string

  @column()
  declare image: string | null

  @column()
  declare text: string | null

  @column()
  declare parentId: string | null

  @column()
  declare status: CategoryStatus

  @column()
  declare sortOrder: number

  @column({
    prepare: (value: CategorySub[]) => JSON.stringify(value ?? []),
    consume: (value: CategorySub[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : (value ?? []),
  })
  declare subs: CategorySub[]

  @column({
    prepare: (value: CategoryPageMeta | null) => (value ? JSON.stringify(value) : null),
    consume: (value: CategoryPageMeta | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare pageMeta: CategoryPageMeta | null

  @column({
    prepare: (value: CategorySuggestedItem[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: CategorySuggestedItem[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare suggested: CategorySuggestedItem[] | null

  @column({
    prepare: (value: SeoMeta | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return { ...emptySeo(), ...JSON.parse(value) }
        } catch {
          return emptySeo()
        }
      }
      return { ...emptySeo(), ...(value as SeoMeta) }
    },
  })
  declare seo: SeoMeta | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Category>

  @hasMany(() => Product, { foreignKey: 'category' })
  declare products: HasMany<typeof Product>

  /** Public / storefront Category shape */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: publicCategoryIcon(this.icon),
      image: this.image ? toPublicMediaUrl(this.image) : null,
      text: this.text ?? null,
      parentId: this.parentId ?? null,
      sortOrder: Number(this.sortOrder) || 0,
      subs: publicSubs(this.subs),
      seo: this.seo ? { ...emptySeo(), ...this.seo } : null,
    }
  }

  /** Admin panel full shape */
  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: publicCategoryIcon(this.icon),
      image: this.image ? toPublicMediaUrl(this.image) : null,
      text: this.text ?? null,
      parentId: this.parentId ?? null,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Number(this.sortOrder) || 0,
      seo: this.seo ? { ...emptySeo(), ...this.seo } : null,
      subs: publicSubs(this.subs),
      pageMeta: publicPageMeta(this.pageMeta),
      suggested: publicSuggested(this.suggested),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}

function looksLikeMediaUrl(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return false
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/uploads/')) return true
  return /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(raw)
}

function publicCategoryIcon(icon: string) {
  const raw = String(icon || '').trim()
  if (!raw) return raw
  return looksLikeMediaUrl(raw) ? toPublicMediaUrl(raw) : raw
}

function publicSubs(subs: CategorySub[] | null | undefined) {
  if (!Array.isArray(subs)) return subs ?? []
  return subs.map((sub) => ({
    ...sub,
    image: sub.image ? toPublicMediaUrl(sub.image) : sub.image ?? null,
  }))
}

function publicSuggested(suggested: CategorySuggestedItem[] | null | undefined) {
  if (!Array.isArray(suggested)) return suggested ?? null
  return suggested.map((item) => ({
    ...item,
    image: item.image ? toPublicMediaUrl(item.image) : item.image,
  }))
}

function publicPageMeta(pageMeta: CategoryPageMeta | null | undefined) {
  if (!pageMeta) return pageMeta ?? null
  return {
    ...pageMeta,
    hero: {
      ...pageMeta.hero,
      image: pageMeta.hero?.image ? toPublicMediaUrl(pageMeta.hero.image) : pageMeta.hero?.image,
    },
  }
}
