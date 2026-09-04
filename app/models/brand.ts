import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { SeoMeta } from '#models/blog_post'

export type BrandStatus = 'active' | 'inactive'

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

export default class Brand extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'brands'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare logo: string | null

  @column()
  declare description: string

  @column()
  declare status: BrandStatus

  @column()
  declare sortOrder: number

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

  toAdminJSON(extras?: { productCount?: number }) {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      logo: this.logo ?? null,
      description: this.description ?? '',
      status: this.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Number(this.sortOrder) || 0,
      seo: this.seo ? { ...emptySeo(), ...this.seo } : emptySeo(),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      ...(extras?.productCount != null ? { productCount: extras.productCount } : {}),
    }
  }
}
