import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'
import Product from '#models/product'

export default class SellerReview extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_reviews'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare shopId: number

  @column()
  declare productId: string

  @column()
  declare name: string

  @column()
  declare rating: number

  @column()
  declare text: string

  @column()
  declare date: string

  @column()
  declare reply: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShop, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof SellerShop>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      name: this.name,
      rating: this.rating,
      text: this.text,
      date: this.date,
      ...(this.reply ? { reply: this.reply } : {}),
    }
  }
}
