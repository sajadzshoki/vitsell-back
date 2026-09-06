import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type BannerType = 'main' | 'secondary'
export type BannerLinkType = 'url' | 'product' | 'category' | 'brand' | 'campaign'
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

  toAdminJSON() {
    return {
      id: this.id,
      title: this.title,
      internalName: this.internalName,
      alt: this.alt,
      image: this.image,
      imageMobile: this.imageMobile,
      link: this.link,
      linkType: this.linkType,
      productId: this.productId,
      brandId: this.brandId,
      campaignId: this.campaignId,
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
    return {
      id: this.id,
      eyebrow: this.alt || this.internalName || '',
      title: this.title || this.alt || '',
      subtitle: '',
      cta: 'مشاهده',
      to: this.link || '/',
      image: this.image,
      icon: 'photo',
      tone: 'primary' as const,
    }
  }

  /** Shape compatible with storefront HomeBanner for promo strips */
  toHomeBannerJSON() {
    return {
      id: this.id,
      title: this.title || this.alt || '',
      subtitle: this.alt && this.alt !== this.title ? this.alt : '',
      image: this.imageMobile || this.image,
      to: this.link || '/',
      tone: 'primary' as const,
    }
  }
}
