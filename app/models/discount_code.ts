import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DiscountCode extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'discount_codes'

  @column({ isPrimary: true })
  declare code: string

  @column()
  declare percent: number

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
