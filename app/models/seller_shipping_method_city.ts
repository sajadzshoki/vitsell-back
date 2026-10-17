import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShippingMethod from '#models/seller_shipping_method'

export default class SellerShippingMethodCity extends BaseModel {
  static table = 'seller_shipping_method_cities'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare methodId: string

  @column()
  declare province: string

  @column()
  declare city: string

  @column()
  declare price: number

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShippingMethod, { foreignKey: 'methodId' })
  declare method: BelongsTo<typeof SellerShippingMethod>

  toJSON() {
    return {
      id: this.id,
      methodId: this.methodId,
      province: this.province,
      city: this.city,
      price: Number(this.price) || 0,
      active: Boolean(this.active),
    }
  }
}
