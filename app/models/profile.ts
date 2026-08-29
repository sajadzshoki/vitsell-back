import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string | null

  @column()
  declare birth: string | null

  @column()
  declare gender: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** Shape matches frontend AccountProfile */
  toAccountProfile(phone: string) {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email ?? '',
      phone,
      birth: this.birth ?? '',
      gender: this.gender ?? '',
    }
  }
}
