import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { SeoMeta } from '#models/blog_post'

export type PageStatus = 'draft' | 'published' | 'archived'

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

export default class StaticPage extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'static_pages'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare path: string

  @column()
  declare title: string

  @column()
  declare subtitle: string

  @column()
  declare icon: string

  @column({
    prepare: (value: unknown[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => {
      if (typeof value !== 'string') return (value as unknown[]) ?? []
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },
  })
  declare sections: unknown[]

  @column()
  declare sourceId: string | null

  @column()
  declare status: PageStatus

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

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column()
  declare template: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toPublicJSON() {
    return {
      id: this.id,
      path: this.path,
      title: this.title,
      subtitle: this.subtitle,
      icon: this.icon,
      sections: this.sections ?? [],
    }
  }

  toAdminJSON() {
    return {
      ...this.toPublicJSON(),
      sourceId: this.sourceId,
      status: this.status,
      seo: { ...emptySeo(), ...(this.seo || {}) },
      publishedAt: this.publishedAt?.toISO() ?? null,
      template: this.template || 'default',
      createdAt: this.createdAt?.toISO() ?? new Date().toISOString(),
      updatedAt: this.updatedAt?.toISO() ?? new Date().toISOString(),
    }
  }

  toJSON() {
    return this.toPublicJSON()
  }
}
