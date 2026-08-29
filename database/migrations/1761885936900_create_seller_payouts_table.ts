import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_payouts'

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
      table.bigInteger('amount').notNullable()
      table.enum('status', ['paid', 'pending']).notNullable().defaultTo('pending')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
