import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .string('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
        .index()
      table.string('name').notNullable()
      table.string('date').notNullable()
      table.integer('rating').notNullable()
      table.text('text').notNullable()
      table.boolean('verified').notNullable().defaultTo(false)
      table.jsonb('pros').nullable()
      table.jsonb('cons').nullable()
      table.boolean('has_image').notNullable().defaultTo(false)
      table.integer('helpful_count').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
