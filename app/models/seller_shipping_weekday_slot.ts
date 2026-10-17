import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShippingMethod from '#models/seller_shipping_method'

export default class SellerShippingWeekdaySlot extends BaseModel {
  static table = 'seller_shipping_weekday_slots'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare methodId: string

  /** 0=شنبه … 6=جمعه */
  @column()
  declare weekday: number

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column()
  declare capacity: number

  @column()
  declare priceOverride: number | null

  @column()
  declare sortOrder: number

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
      weekday: Number(this.weekday),
      startTime: this.startTime,
      endTime: this.endTime,
      capacity: Number(this.capacity) || 0,
      priceOverride: this.priceOverride == null ? null : Number(this.priceOverride),
      sortOrder: Number(this.sortOrder) || 0,
    }
  }
}
