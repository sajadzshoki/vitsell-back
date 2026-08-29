import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_orders'

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
      table.string('date').notNullable()
      table.string('date_key').notNullable().index()
      table
        .enum('status', ['new', 'packing', 'shipped', 'delivered', 'returned', 'cancelled'])
        .notNullable()
        .defaultTo('new')
      table.string('customer_name').notNullable()
      table.string('customer_phone').notNullable()
      table.string('city').notNullable()
      table.jsonb('address').notNullable()
      table.jsonb('items').notNullable()
      table.bigInteger('total').notNullable()
      table.string('shipping_method').notNullable()
      table.string('payment_method').notNullable()
      table.text('note').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
