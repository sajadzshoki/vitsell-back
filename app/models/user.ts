import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { AccessToken } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import Profile from '#models/profile'
import AdminRole from '#models/admin_role'

export default class User extends BaseModel {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare phone: string

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare role: 'customer' | 'seller' | 'admin' | 'courier'

  @column()
  declare status: 'active' | 'inactive' | 'blocked'

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>

  @manyToMany(() => AdminRole, {
    pivotTable: 'admin_user_roles',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare adminRoles: ManyToMany<typeof AdminRole>

  get hasPassword() {
    return Boolean(this.password)
  }

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password && user.password) {
      user.password = await hash.make(user.password)
    }
  }

  async verifyPassword(plain: string) {
    if (!this.password) return false
    return hash.verify(this.password, plain)
  }
}
