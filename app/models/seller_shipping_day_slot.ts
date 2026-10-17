import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShippingDayOverride from '#models/seller_shipping_day_override'

export default class SellerShippingDaySlot extends BaseModel {
  static table = 'seller_shipping_day_slots'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare overrideId: number

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

  @belongsTo(() => SellerShippingDayOverride, { foreignKey: 'overrideId' })
  declare override: BelongsTo<typeof SellerShippingDayOverride>

  toJSON() {
    return {
      id: this.id,
      overrideId: this.overrideId,
      startTime: this.startTime,
      endTime: this.endTime,
      capacity: Number(this.capacity) || 0,
      priceOverride: this.priceOverride == null ? null : Number(this.priceOverride),
      sortOrder: Number(this.sortOrder) || 0,
    }
  }
}
