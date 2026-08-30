import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerOrder from '#models/seller_order'
import Product from '#models/product'

export default class SellerOrderItemRow extends BaseModel {
  static table = 'seller_order_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sellerOrderId: string

  @column()
  declare productId: string

  @column()
  declare qty: number

  @column()
  declare unitPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerOrder, { foreignKey: 'sellerOrderId' })
  declare sellerOrder: BelongsTo<typeof SellerOrder>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
