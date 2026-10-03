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

  @column()
  declare avatar: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** Shape matches frontend AccountProfile (+ admin RBAC fields when provided) */
  toAccountProfile(
    phone: string,
    hasPassword = false,
    role: 'customer' | 'seller' | 'admin' | 'courier' = 'customer',
    extras?: {
      adminId?: string
      adminStatus?: string
      roleIds?: string[]
      abilities?: string[]
      primaryRoleKey?: string | null
      isCourier?: boolean
    },
  ) {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email ?? '',
      phone,
      birth: this.birth ?? '',
      gender: this.gender ?? '',
      avatar: this.avatar ?? '',
      hasPassword,
      role,
      isCourier: Boolean(extras?.isCourier),
      ...(extras?.adminId != null ? { adminId: extras.adminId } : {}),
      ...(extras?.adminStatus != null ? { adminStatus: extras.adminStatus } : {}),
      ...(extras?.roleIds != null ? { roleIds: extras.roleIds } : {}),
      ...(extras?.abilities != null ? { abilities: extras.abilities } : {}),
      ...(extras?.primaryRoleKey !== undefined ? { primaryRoleKey: extras.primaryRoleKey } : {}),
    }
  }
}
