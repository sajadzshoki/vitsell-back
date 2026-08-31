import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .integer('wallet_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('wallets')
        .onDelete('CASCADE')
        .index()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()
      table
        .enum('type', ['topup', 'purchase', 'refund', 'reward', 'withdraw'])
        .notNullable()
      table.bigInteger('amount').notNullable()
      table.bigInteger('signed_amount').notNullable()
      table
        .enum('status', ['success', 'pending', 'failed'])
        .notNullable()
        .defaultTo('pending')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('date').notNullable()
      table.string('time').notNullable()
      table.string('ref_id').nullable()
      table.string('authority').nullable().index()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
