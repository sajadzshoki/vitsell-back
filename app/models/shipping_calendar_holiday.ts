import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ShippingCalendarHoliday extends BaseModel {
  static table = 'shipping_calendar_holidays'

  @column({ isPrimary: true })
  declare id: number

  @column.date()
  declare date: DateTime

  @column()
  declare title: string

  @column()
  declare source: 'iran' | 'manual'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toJSON() {
    return {
      id: this.id,
      date: this.date?.toISODate() ?? null,
      title: this.title || '',
      source: this.source === 'iran' ? 'iran' : 'manual',
    }
  }
}
