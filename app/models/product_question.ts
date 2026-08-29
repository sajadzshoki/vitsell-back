import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

export type ProductQuestionAnswer = {
  author: string
  date: string
  text: string
  helpfulYes: number
  helpfulNo: number
}

export default class ProductQuestion extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'product_questions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column()
  declare name: string

  @column()
  declare date: string

  @column()
  declare verified: boolean

  @column()
  declare question: string

  @column({
    prepare: (value: ProductQuestionAnswer | null) => (value ? JSON.stringify(value) : null),
    consume: (value: ProductQuestionAnswer | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare answer: ProductQuestionAnswer | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      date: this.date,
      verified: this.verified,
      question: this.question,
      ...(this.answer ? { answer: this.answer } : {}),
    }
  }
}
