import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerReview from '#models/seller_review'
import SellerPayout from '#models/seller_payout'

export default class SellerShop extends BaseModel {
  static table = 'seller_shops'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare phone: string

  @column()
  declare email: string

  @column()
  declare city: string

  @column()
  declare about: string

  @column()
  declare rating: number

  @column()
  declare reviewCount: number

  @column()
  declare joinDate: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => SellerListing, { foreignKey: 'shopId' })
  declare listings: HasMany<typeof SellerListing>

  @hasMany(() => SellerOrder, { foreignKey: 'shopId' })
  declare orders: HasMany<typeof SellerOrder>

  @hasMany(() => SellerReview, { foreignKey: 'shopId' })
  declare reviews: HasMany<typeof SellerReview>

  @hasMany(() => SellerPayout, { foreignKey: 'shopId' })
  declare payouts: HasMany<typeof SellerPayout>

  toJSON() {
    return {
      name: this.name,
      slug: this.slug,
      phone: this.phone,
      email: this.email,
      city: this.city,
      about: this.about,
      rating: this.rating,
      reviewCount: this.reviewCount,
      joinDate: this.joinDate,
    }
  }
}
