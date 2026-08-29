import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BlogPost extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'blog_posts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare excerpt: string

  @column()
  declare date: string

  @column()
  declare category: string

  @column()
  declare readTime: string

  @column()
  declare author: string

  @column()
  declare image: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare relatedCategories: string[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare content: string[]

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare highlights: string[] | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      excerpt: this.excerpt,
      date: this.date,
      category: this.category,
      readTime: this.readTime,
      author: this.author,
      image: this.image,
      relatedCategories: this.relatedCategories ?? [],
      content: this.content ?? [],
      ...(this.highlights?.length ? { highlights: this.highlights } : {}),
    }
  }
}
