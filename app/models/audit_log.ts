import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'login'
  | 'permission_change'
  | 'other'

export type AuditEntity =
  | 'product'
  | 'order'
  | 'category'
  | 'promotion'
  | 'banner'
  | 'admin'
  | 'role'
  | 'inventory'
  | 'customer'
  | 'settings'
  | 'system'
  | 'payment'
  | 'refund'
  | 'settlement'
  | 'adjustment'
  | 'finance'

export default class AuditLog extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'audit_logs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare actorId: number | null

  @column()
  declare actorName: string

  @column()
  declare action: AuditAction | string

  @column()
  declare entity: AuditEntity | string

  @column()
  declare entityId: string

  @column()
  declare summary: string

  @column()
  declare previousValue: string | null

  @column()
  declare newValue: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'actorId' })
  declare actor: BelongsTo<typeof User>

  toAdminJSON() {
    return {
      id: this.id,
      actorId: this.actorId != null ? String(this.actorId) : '',
      actorName: this.actorName || '',
      action: this.action,
      entity: this.entity,
      entityId: this.entityId || '',
      summary: this.summary,
      previousValue: this.previousValue,
      newValue: this.newValue,
      createdAt: this.createdAt?.toISO() ?? new Date().toISOString(),
    }
  }
}
