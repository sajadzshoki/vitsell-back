import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type BlogStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type SeoMeta = {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  robots: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
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

function parseJsonArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

export default class BlogPost extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'blog_posts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare excerpt: string

  @column()
  declare date: string

  @column()
  declare category: string

  @column()
  declare readTime: string

  @column()
  declare author: string

  @column()
  declare image: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray(value),
  })
  declare relatedCategories: string[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray(value),
  })
  declare content: string[]

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (!value) return null
      const arr = parseJsonArray(value)
      return arr.length ? arr : null
    },
  })
  declare highlights: string[] | null

  @column()
  declare popular: boolean

  @column()
  declare engagement: number

  @column()
  declare active: boolean

  @column()
  declare status: BlogStatus

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column()
  declare featured: boolean

  @column()
  declare imageAlt: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray(value),
  })
  declare tags: string[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => parseJsonArray(value),
  })
  declare relatedPostIds: string[]

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

  isPubliclyVisible(now = DateTime.utc()) {
    if (this.status === 'archived' || this.status === 'draft') return false
    if (this.status === 'scheduled') {
      if (!this.scheduledAt || this.scheduledAt > now) return false
      return true
    }
    return this.status === 'published' && this.active !== false
  }

  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      excerpt: this.excerpt,
      date: this.date,
      category: this.category,
      readTime: this.readTime,
      author: this.author,
      image: this.image,
      relatedCategories: this.relatedCategories ?? [],
      content: this.content ?? [],
      ...(this.highlights?.length ? { highlights: this.highlights } : {}),
      popular: this.featured || this.popular,
      engagement: this.engagement ?? 0,
      active: this.isPubliclyVisible(),
    }
  }

  toAdminJSON() {
    return {
      ...this.toPublicJSON(),
      popular: this.popular,
      featured: this.featured,
      engagement: this.engagement ?? 0,
      active: this.active,
      status: this.status,
      publishedAt: this.publishedAt?.toISO() ?? null,
      scheduledAt: this.scheduledAt?.toISO() ?? null,
      imageAlt: this.imageAlt || this.title || '',
      tags: this.tags ?? [],
      relatedPostIds: this.relatedPostIds ?? [],
      seo: { ...emptySeo(), ...(this.seo || {}) },
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }

  /** @deprecated use toPublicJSON */
  toJSON() {
    return this.toPublicJSON()
  }
}
