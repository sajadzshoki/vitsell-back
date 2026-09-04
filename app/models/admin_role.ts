import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import { publicRoleId, type AdminRoleStatus } from '#utils/admin_rbac'

function parsePermissions(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

export default class AdminRole extends BaseModel {
  static table = 'admin_roles'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare isSystem: boolean

  @column({
    prepare: (value: string[] | null) => JSON.stringify(Array.isArray(value) ? value : []),
    consume: (value: unknown) => parsePermissions(value),
  })
  declare permissions: string[]

  @column()
  declare status: AdminRoleStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'admin_user_roles',
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  get publicId() {
    return publicRoleId(this.key)
  }

  toAdminJSON(extras?: { adminCount?: number }) {
    return {
      id: this.publicId,
      key: this.key,
      name: this.name,
      description: this.description || '',
      status: this.status === 'inactive' ? 'inactive' : 'active',
      permissions: Array.isArray(this.permissions) ? this.permissions : [],
      isSystem: Boolean(this.isSystem),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      ...(extras?.adminCount != null ? { adminCount: extras.adminCount } : {}),
    }
  }
}
