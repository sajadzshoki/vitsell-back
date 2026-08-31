import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Notification extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare time: string

  @column()
  declare icon: string

  @column()
  declare read: boolean

  @column()
  declare to: string | null

  @column()
  declare campaignId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      time: this.time,
      icon: this.icon,
      read: this.read,
      ...(this.to ? { to: this.to } : {}),
    }
  }
}
