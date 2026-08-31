import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ContactMessage extends BaseModel {
  static table = 'contact_messages'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string

  @column()
  declare phone: string

  @column()
  declare email: string | null

  @column()
  declare subject: string

  @column()
  declare message: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      phone: this.phone,
      email: this.email ?? '',
      subject: this.subject,
      message: this.message,
    }
  }
}
