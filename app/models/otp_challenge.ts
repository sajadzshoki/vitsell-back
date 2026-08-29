import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class OtpChallenge extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare phone: string

  @column()
  declare code: string

  @column()
  declare attempts: number

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
