import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: string

  @column()
  declare authority: string | null

  @column()
  declare amount: number

  @column()
  declare status: 'pending' | 'paid' | 'failed' | 'cancelled'

  @column()
  declare refId: string | null

  @column()
  declare cardPan: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
