import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Product from '#models/product'

export type ActivityEventType =
  | 'product_view'
  | 'category_view'
  | 'search'
  | 'add_to_cart'
  | 'wishlist'

export default class UserActivity extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventType: ActivityEventType

  @column()
  declare productId: string | null

  @column()
  declare category: string | null

  @column()
  declare query: string | null

  @column.dateTime()
  declare occurredAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
