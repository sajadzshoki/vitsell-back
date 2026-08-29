import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_listings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
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
      table.integer('stock').notNullable().defaultTo(0)
      table.integer('sold').notNullable().defaultTo(0)
      table.integer('views').notNullable().defaultTo(0)
      table
        .enum('status', ['active', 'pending', 'inactive', 'out_of_stock'])
        .notNullable()
        .defaultTo('pending')
      table.unique(['shop_id', 'product_id'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
