import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SellerShippingMethod from '#models/seller_shipping_method'
import SellerShippingDaySlot from '#models/seller_shipping_day_slot'

export default class SellerShippingDayOverride extends BaseModel {
  static table = 'seller_shipping_day_overrides'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare methodId: string

  @column.date()
  declare date: DateTime

  @column()
  declare isClosed: boolean

  @column()
  declare useCustomSlots: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShippingMethod, { foreignKey: 'methodId' })
  declare method: BelongsTo<typeof SellerShippingMethod>

  @hasMany(() => SellerShippingDaySlot, { foreignKey: 'overrideId' })
  declare slots: HasMany<typeof SellerShippingDaySlot>

  toJSON() {
    return {
      id: this.id,
      methodId: this.methodId,
      date: this.date?.toISODate() ?? null,
      isClosed: Boolean(this.isClosed),
      useCustomSlots: Boolean(this.useCustomSlots),
      slots: this.slots?.map((s) => s.toJSON()) ?? [],
    }
  }
}
