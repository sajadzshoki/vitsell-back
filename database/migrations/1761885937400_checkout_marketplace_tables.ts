import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('seller_orders', (table) => {
      table
        .string('buyer_order_id')
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')
        .index()
      table.boolean('stock_reserved').notNullable().defaultTo(false)
    })

    this.schema.createTable('order_items', (table) => {
      table.increments('id').notNullable()
      table
        .string('order_id')
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
        .index()
      table
        .string('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
      table.integer('qty').notNullable()
      table.bigInteger('unit_price').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('seller_order_items', (table) => {
      table.increments('id').notNullable()
      table
        .string('seller_order_id')
        .notNullable()
        .references('id')
        .inTable('seller_orders')
        .onDelete('CASCADE')
        .index()
      table
        .string('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
      table.integer('qty').notNullable()
      table.bigInteger('unit_price').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.alterTable('products', (table) => {
      table.text('description').nullable()
      table.jsonb('features').nullable()
      table.jsonb('buy_notes').nullable()
    })
  }

  async down() {
    this.schema.alterTable('products', (table) => {
      table.dropColumn('description')
      table.dropColumn('features')
      table.dropColumn('buy_notes')
    })
    this.schema.dropTable('seller_order_items')
    this.schema.dropTable('order_items')
    this.schema.alterTable('seller_orders', (table) => {
      table.dropColumn('buyer_order_id')
      table.dropColumn('stock_reserved')
    })
  }
}
