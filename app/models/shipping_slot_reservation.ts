import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type ShippingReservationStatus = 'held' | 'confirmed' | 'released'

export default class ShippingSlotReservation extends BaseModel {
  static table = 'shipping_slot_reservations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare methodId: string

  @column.date()
  declare slotDate: DateTime

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column()
  declare orderId: string

  @column()
  declare status: ShippingReservationStatus

  @column()
  declare isExpress: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
