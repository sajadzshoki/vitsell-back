import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type SellerShippingMethodStatus = 'active' | 'inactive'

export default class SellerShippingMethod extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_shipping_methods'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare carrier: string

  @column()
  declare estimatedDays: string

  @column()
  declare baseCost: number

  @column()
  declare status: SellerShippingMethodStatus

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      carrier: this.carrier ?? '',
      estimatedDays: this.estimatedDays ?? '',
      baseCost: Number(this.baseCost) || 0,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Number(this.sortOrder) || 0,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
