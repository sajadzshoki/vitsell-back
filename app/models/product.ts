import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'

export type ProductColor = { name: string; hex: string }
export type ProductSpec = { key: string; value: string }

export default class Product extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare brand: string

  @column()
  declare category: string

  @column()
  declare categoryLabel: string

  @column()
  declare price: number

  @column()
  declare oldPrice: number | null

  @column()
  declare rating: number

  @column()
  declare reviews: number

  @column()
  declare image: string

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare gallery: string[] | null

  @column()
  declare badge: string | null

  @column({
    prepare: (value: ProductColor[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: ProductColor[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare colors: ProductColor[] | null

  @column()
  declare inStock: boolean

  @column()
  declare fastDelivery: boolean

  @column()
  declare shortDesc: string | null

  @column()
  declare shortName: string | null

  @column({
    prepare: (value: Record<string, number> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: Record<string, number> | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare scores: Record<string, number> | null

  @column({
    prepare: (value: ProductSpec[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: ProductSpec[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare specs: ProductSpec[] | null

  @column()
  declare soldCount: number

  @column()
  declare viewCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category, { foreignKey: 'category' })
  declare categoryRelation: BelongsTo<typeof Category>

  @hasMany(() => ProductReview)
  declare productReviews: HasMany<typeof ProductReview>

  @hasMany(() => ProductQuestion)
  declare productQuestions: HasMany<typeof ProductQuestion>

  /** Frontend Product shape */
  toCatalogJSON() {
    return {
      id: this.id,
      title: this.title,
      brand: this.brand,
      category: this.category,
      categoryLabel: this.categoryLabel,
      price: Number(this.price),
      ...(this.oldPrice != null ? { oldPrice: Number(this.oldPrice) } : {}),
      rating: this.rating,
      reviews: this.reviews,
      image: this.image,
      ...(this.gallery?.length ? { gallery: this.gallery } : {}),
      ...(this.badge ? { badge: this.badge } : {}),
      ...(this.colors?.length ? { colors: this.colors } : {}),
      inStock: this.inStock,
      fastDelivery: this.fastDelivery,
      ...(this.shortDesc ? { shortDesc: this.shortDesc } : {}),
      ...(this.shortName ? { shortName: this.shortName } : {}),
      ...(this.scores ? { scores: this.scores } : {}),
      ...(this.specs?.length ? { specs: this.specs } : {}),
    }
  }
}
