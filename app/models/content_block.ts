import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ContentBlock extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'content_blocks'

  @column({ isPrimary: true })
  declare key: string

  @column({
    prepare: (value: unknown) => JSON.stringify(value),
    consume: (value: unknown) => {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      }
      catch {
        return value
      }
    },
  })
  declare value: unknown

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
