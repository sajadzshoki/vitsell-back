import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'

export default class SellerPayout extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_payouts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare shopId: number

  @column()
  declare date: string

  @column()
  declare amount: number

  @column()
  declare status: 'paid' | 'pending'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShop, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof SellerShop>

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      amount: Number(this.amount),
      status: this.status,
    }
  }
}
