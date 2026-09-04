import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type WarehouseStatus = 'active' | 'inactive'

export default class Warehouse extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'warehouses'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare city: string

  @column()
  declare address: string

  @column()
  declare status: WarehouseStatus

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      city: this.city ?? '',
      address: this.address ?? '',
      status: this.status === 'inactive' ? 'inactive' : 'active',
      isDefault: Boolean(this.isDefault),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
