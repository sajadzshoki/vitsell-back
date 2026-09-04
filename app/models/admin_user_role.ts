import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Pivot model optional — Lucid manyToMany handles the table */
export default class AdminUserRole extends BaseModel {
  static table = 'admin_user_roles'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare roleId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
