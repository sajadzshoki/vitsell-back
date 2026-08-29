import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('title').notNullable()
      table.string('brand').notNullable().index()
      table
        .string('category')
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
        .index()
      table.string('category_label').notNullable()
      table.bigInteger('price').notNullable()
      table.bigInteger('old_price').nullable()
      table.float('rating').notNullable().defaultTo(0)
      table.integer('reviews').notNullable().defaultTo(0)
      table.string('image').notNullable()
      table.jsonb('gallery').nullable()
      table.string('badge').nullable()
      table.jsonb('colors').nullable()
      table.boolean('in_stock').notNullable().defaultTo(true)
      table.boolean('fast_delivery').notNullable().defaultTo(false)
      table.text('short_desc').nullable()
      table.string('short_name').nullable()
      table.jsonb('scores').nullable()
      table.jsonb('specs').nullable()
      table.integer('sold_count').notNullable().defaultTo(0)
      table.integer('view_count').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
