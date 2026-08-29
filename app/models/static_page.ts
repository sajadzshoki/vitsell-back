import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class StaticPage extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'static_pages'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare path: string

  @column()
  declare title: string

  @column()
  declare subtitle: string

  @column()
  declare icon: string

  @column({
    prepare: (value: unknown[]) => JSON.stringify(value),
    consume: (value: unknown[] | string) => {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      }
      catch {
        return value
      }
    },
  })
  declare sections: unknown[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toJSON() {
    return {
      id: this.id,
      path: this.path,
      title: this.title,
      subtitle: this.subtitle,
      icon: this.icon,
      sections: this.sections,
    }
  }
}
