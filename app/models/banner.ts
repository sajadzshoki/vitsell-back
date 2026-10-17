import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type BannerType = 'main' | 'secondary'
export type BannerLinkType = 'none' | 'url' | 'product' | 'category' | 'brand' | 'campaign'
export type BannerPlacement =
  | 'homepage_hero'
  | 'homepage_promo_strip'
  | 'homepage_category'
  | 'homepage_product_section'
  | 'product_listing'
  | 'category_page'
  | 'category_page_hero'
  | 'category_page_promo'
  | 'product_detail'
  | 'sidebar'
  | 'footer_promo'

export default class Banner extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'banners'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare internalName: string

  @column()
  declare alt: string

  @column()
  declare image: string

  @column()
  declare imageMobile: string | null

  /** CSS aspect-ratio like "16/9" or "4/1" */
  @column()
  declare aspectDesktop: string

  /** CSS aspect-ratio like "3/1" or "16/9" */
  @column()
  declare aspectMobile: string

  @column()
  declare link: string

  @column()
  declare linkType: BannerLinkType

  @column()
  declare productId: string | null

  @column()
  declare brandId: string | null

  @column()
  declare campaignId: string | null

  @column()
  declare buttonText: string | null

  @column()
  declare type: BannerType

  @column()
  declare placement: BannerPlacement

  @column()
  declare categoryId: string | null

  @column()
  declare active: boolean

  @column.dateTime()
  declare startsAt: DateTime | null

  @column.dateTime()
  declare endsAt: DateTime | null

  @column()
  declare sortOrder: number

  @column()
  declare priority: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  isLive(now = DateTime.utc()) {
    if (!this.active) return false
    if (this.startsAt && this.startsAt > now) return false
    if (this.endsAt && this.endsAt < now) return false
    return true
  }

  /** Resolve public href from link type + target fields */
  resolveHref(): string {
    if (this.linkType === 'none') return ''
    const explicit = (this.link || '').trim()
    if (explicit) return explicit
    if (this.linkType === 'product' && this.productId) {
      return `/product/${this.productId}`
    }
    if (this.linkType === 'category' && this.categoryId) {
      return `/search?category=${encodeURIComponent(this.categoryId)}`
    }
    if (this.linkType === 'brand' && this.brandId) {
      return `/search?brand=${encodeURIComponent(this.brandId)}`
    }
    if (this.linkType === 'campaign' && this.campaignId) {
      return `/search?campaign=${encodeURIComponent(this.campaignId)}`
    }
    return ''
  }

  toAdminJSON() {
    return {
      id: this.id,
      title: this.title,
      internalName: this.internalName,
      alt: this.alt,
      image: this.image,
      imageMobile: this.imageMobile,
      aspectDesktop: this.aspectDesktop || '4/1',
      aspectMobile: this.aspectMobile || '3/1',
      link: this.link,
      linkType: this.linkType,
      productId: this.productId,
      brandId: this.brandId,
      campaignId: this.campaignId,
      buttonText: this.buttonText,
      type: this.type,
      placement: this.placement,
      categoryId: this.categoryId,
      active: this.active,
      startsAt: this.startsAt?.toISO() ?? null,
      endsAt: this.endsAt?.toISO() ?? null,
      sortOrder: this.sortOrder,
      priority: this.priority,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }

  /** Shape compatible with public HeroSlide for homepage_hero */
  toHeroSlideJSON() {
    const to = this.resolveHref()
    const button = (this.buttonText || '').trim()
    return {
      id: this.id,
      eyebrow: this.alt || this.internalName || '',
      title: this.title || this.alt || '',
      subtitle: '',
      cta: to ? button || 'مشاهده' : '',
      to,
      image: this.image,
      imageMobile: this.imageMobile || undefined,
      aspectDesktop: this.aspectDesktop || '4/1',
      aspectMobile: this.aspectMobile || '3/1',
      icon: 'photo',
      tone: 'primary' as const,
    }
  }

  /** Shape compatible with storefront HomeBanner for promo strips */
  toHomeBannerJSON() {
    const to = this.resolveHref()
    return {
      id: this.id,
      title: this.title || this.alt || '',
      subtitle: this.alt && this.alt !== this.title ? this.alt : '',
      image: this.imageMobile || this.image,
      to: to || undefined,
      buttonText: to ? (this.buttonText || '').trim() || undefined : undefined,
      tone: 'primary' as const,
    }
  }
}
