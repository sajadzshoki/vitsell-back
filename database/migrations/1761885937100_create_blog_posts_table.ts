import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('title').notNullable()
      table.text('excerpt').notNullable()
      table.string('date').notNullable()
      table.string('category').notNullable()
      table.string('read_time').notNullable()
      table.string('author').notNullable()
      table.string('image').notNullable()
      table.jsonb('related_categories').notNullable().defaultTo('[]')
      table.jsonb('content').notNullable()
      table.jsonb('highlights').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
