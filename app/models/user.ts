import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { AccessToken } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import Profile from '#models/profile'

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
  declare role: 'customer' | 'seller' | 'admin'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>

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
