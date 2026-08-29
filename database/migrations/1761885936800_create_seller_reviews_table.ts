import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .integer('shop_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('seller_shops')
        .onDelete('CASCADE')
        .index()
      table
        .string('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('rating').notNullable()
      table.text('text').notNullable()
      table.string('date').notNullable()
      table.text('reply').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
