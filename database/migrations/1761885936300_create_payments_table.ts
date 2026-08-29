import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .string('order_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table.string('authority').nullable().index()
      table.bigInteger('amount').notNullable()
      table
        .enum('status', ['pending', 'paid', 'failed', 'cancelled'])
        .notNullable()
        .defaultTo('pending')
      table.string('ref_id').nullable()
      table.string('card_pan').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
