import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { SeoMeta } from '#models/blog_post'
import {
  emptyStoreDiscountTargeting,
  type StoreDiscountTargeting,
} from '#models/store_discount'

export type StoreCampaignManualStatus = 'draft' | 'paused' | 'archived' | 'active'

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

function parseStringArray(value: string[] | string | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export default class StoreCampaign extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'store_campaigns'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare manualStatus: StoreCampaignManualStatus

  @column.dateTime()
  declare startsAt: DateTime

  @column.dateTime()
  declare endsAt: DateTime

  @column()
  declare priority: number

  @column()
  declare image: string | null

  @column()
  declare landingUrl: string

  @column()
  declare slug: string

  @column({
    prepare: (value: SeoMeta | null) => (value ? JSON.stringify(value) : null),
    consume: (value: SeoMeta | string | null) => {
      if (!value) return emptySeo()
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
  declare seo: SeoMeta

  @column({
    prepare: (value: StoreDiscountTargeting | null) =>
      value ? JSON.stringify(value) : JSON.stringify(emptyStoreDiscountTargeting()),
    consume: (value: StoreDiscountTargeting | string | null) => {
      if (!value) return emptyStoreDiscountTargeting()
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      return { ...emptyStoreDiscountTargeting(), ...parsed }
    },
  })
  declare targeting: StoreDiscountTargeting

  @column({
    prepare: (value: string[] | null) => JSON.stringify(value ?? []),
    consume: (value: string[] | string | null) => parseStringArray(value),
  })
  declare discountIds: string[]

  @column({
    prepare: (value: string[] | null) => JSON.stringify(value ?? []),
    consume: (value: string[] | string | null) => parseStringArray(value),
  })
  declare couponCodes: string[]

  @column({
    prepare: (value: string[] | null) => JSON.stringify(value ?? []),
    consume: (value: string[] | string | null) => parseStringArray(value),
  })
  declare dealIds: string[]

  @column({
    prepare: (value: string[] | null) => JSON.stringify(value ?? []),
    consume: (value: string[] | string | null) => parseStringArray(value),
  })
  declare bannerIds: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  lifecycle(now = DateTime.utc()) {
    if (this.manualStatus === 'archived') return 'archived'
    if (this.manualStatus === 'draft') return 'draft'
    if (this.manualStatus === 'paused') return 'paused'
    if (this.endsAt && this.endsAt <= now) return 'expired'
    if (this.startsAt && this.startsAt > now) return 'scheduled'
    return 'active'
  }

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description ?? '',
      manualStatus: this.manualStatus,
      startsAt: this.startsAt?.toISO() ?? null,
      endsAt: this.endsAt?.toISO() ?? null,
      priority: Number(this.priority) || 0,
      image: this.image ?? null,
      landingUrl: this.landingUrl ?? '',
      slug: this.slug,
      seo: this.seo ? { ...emptySeo(), ...this.seo } : emptySeo(),
      targeting: this.targeting ?? emptyStoreDiscountTargeting(),
      discountIds: this.discountIds ?? [],
      couponCodes: this.couponCodes ?? [],
      dealIds: this.dealIds ?? [],
      bannerIds: this.bannerIds ?? [],
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      lifecycle: this.lifecycle(),
    }
  }
}
