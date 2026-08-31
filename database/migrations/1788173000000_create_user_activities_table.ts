import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_activities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('event_type', 32).notNullable()
      table.string('product_id').nullable().references('id').inTable('products').onDelete('SET NULL')
      table.string('category', 64).nullable()
      table.string('query', 255).nullable()
      table.timestamp('occurred_at').notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['user_id', 'event_type'])
      table.index(['user_id', 'occurred_at'])
      table.index(['user_id', 'category'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
