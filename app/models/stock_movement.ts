import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type StockMovementType =
  | 'add'
  | 'remove'
  | 'adjust'
  | 'reserve'
  | 'release'
  | 'return'
  | 'refund'
  | 'correction'

export default class StockMovement extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'stock_movements'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column()
  declare productTitle: string

  @column()
  declare variantId: string | null

  @column()
  declare variantLabel: string | null

  @column()
  declare warehouseId: string

  @column()
  declare type: StockMovementType

  @column()
  declare quantity: number

  @column()
  declare before: number

  @column()
  declare after: number

  @column()
  declare reason: string

  @column()
  declare actorName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      productId: this.productId,
      productTitle: this.productTitle,
      variantId: this.variantId,
      variantLabel: this.variantLabel,
      warehouseId: this.warehouseId,
      type: this.type,
      quantity: Number(this.quantity) || 0,
      before: Number(this.before) || 0,
      after: Number(this.after) || 0,
      reason: this.reason ?? '',
      actorName: this.actorName ?? '',
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
