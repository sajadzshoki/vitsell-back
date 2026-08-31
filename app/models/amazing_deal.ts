import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

export default class AmazingDeal extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'amazing_deals'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column()
  declare discountPercent: number

  @column.dateTime()
  declare startsAt: DateTime

  @column.dateTime()
  declare endsAt: DateTime

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare product: BelongsTo<typeof Product>

  isLive(now = DateTime.utc()) {
    if (!this.active) return false
    return this.startsAt <= now && this.endsAt >= now
  }

  toAdminJSON() {
    return {
      id: this.id,
      productId: this.productId,
      discountPercent: this.discountPercent,
      startsAt: this.startsAt?.toISO() ?? null,
      endsAt: this.endsAt?.toISO() ?? null,
      active: this.active,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
