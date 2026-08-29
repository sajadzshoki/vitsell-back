import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'
import Product from '#models/product'

export default class SellerListing extends BaseModel {
  static table = 'seller_listings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number

  @column()
  declare productId: string

  @column()
  declare stock: number

  @column()
  declare sold: number

  @column()
  declare views: number

  @column()
  declare status: 'active' | 'pending' | 'inactive' | 'out_of_stock'

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
      productId: this.productId,
      stock: this.stock,
      sold: this.sold,
      views: this.views,
      status: this.status,
    }
  }
}
