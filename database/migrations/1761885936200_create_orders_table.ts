import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table.string('date').notNullable()
      table
        .enum('status', ['delivered', 'shipping', 'processing', 'cancelled', 'pending_payment'])
        .notNullable()
        .defaultTo('processing')
      table.jsonb('items').notNullable()
      table.bigInteger('total').notNullable()
      table.string('shipping_method').notNullable()
      table.string('payment_method').notNullable()
      table.jsonb('address').notNullable()
      table.string('discount_code').nullable()
      table.bigInteger('discount_amount').notNullable().defaultTo(0)
      table.bigInteger('shipping_cost').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
