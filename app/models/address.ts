import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Address extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare fullName: string

  @column()
  declare phone: string

  @column()
  declare province: string

  @column()
  declare city: string

  @column()
  declare address: string

  @column()
  declare postalCode: string

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** Frontend CheckoutAddress */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      fullName: this.fullName,
      phone: this.phone,
      province: this.province,
      city: this.city,
      address: this.address,
      postalCode: this.postalCode,
      ...(this.isDefault ? { isDefault: true } : {}),
    }
  }
}
