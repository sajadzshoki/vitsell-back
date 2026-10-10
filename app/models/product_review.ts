import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import User from '#models/user'

export default class ProductReview extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'product_reviews'

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
  declare rating: number

  @column()
  declare text: string

  @column()
  declare verified: boolean

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare pros: string[] | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare cons: string[] | null

  @column()
  declare hasImage: boolean

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare images: string[] | null

  @column()
  declare helpfulCount: number

  @column()
  declare recommend: boolean

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
      name: this.name,
      date: this.date,
      rating: this.rating,
      text: this.text,
      verified: this.verified,
      ...(this.pros?.length ? { pros: this.pros } : {}),
      ...(this.cons?.length ? { cons: this.cons } : {}),
      ...(this.images?.length || this.hasImage ? { hasImage: true } : {}),
      ...(this.images?.length ? { images: this.images } : {}),
      helpfulCount: this.helpfulCount,
      recommend: this.recommend,
    }
  }

  toAccountJSON(
    product?: Product | null,
    sellerReply?: string | null
  ) {
    const p = product ?? this.product
    const reply = sellerReply?.trim()
    return {
      id: this.id,
      productId: this.productId,
      productTitle: p?.title ?? this.productId,
      productImage: p?.image ?? '',
      date: this.date,
      rating: this.rating,
      text: this.text,
      verified: this.verified,
      ...(this.pros?.length ? { pros: this.pros } : {}),
      ...(this.cons?.length ? { cons: this.cons } : {}),
      helpfulCount: this.helpfulCount,
      replies: reply
        ? [
            {
              id: `${this.id}-seller-reply`,
              author: 'فروشگاه',
              date: this.date,
              text: reply,
              role: 'seller' as const,
            },
          ]
        : ([] as {
            id: string
            author: string
            date: string
            text: string
            role: 'seller' | 'support'
          }[]),
    }
  }
}
