import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import User from '#models/user'

export type ProductQuestionAnswer = {
  author: string
  date: string
  text: string
  helpfulYes: number
  helpfulNo: number
  role?: 'seller' | 'support'
}

export default class ProductQuestion extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'product_questions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column()
  declare userId: number | null

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

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      name: this.name,
      date: this.date,
      verified: this.verified,
      question: this.question,
      ...(this.answer ? { answer: this.answer } : {}),
    }
  }

  toAccountJSON(product?: Product | null) {
    const p = product ?? this.product
    return {
      id: this.id,
      productId: this.productId,
      productTitle: p?.title ?? this.productId,
      productImage: p?.image ?? '',
      date: this.date,
      question: this.question,
      verified: this.verified,
      ...(this.answer
        ? {
            answer: {
              author: this.answer.author,
              date: this.answer.date,
              text: this.answer.text,
              role: this.answer.role === 'seller' ? ('seller' as const) : ('support' as const),
            },
          }
        : {}),
    }
  }
}
