import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

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
      table.string('title').notNullable()
      table.string('full_name').notNullable()
      table.string('phone', 11).notNullable()
      table.string('province').notNullable()
      table.string('city').notNullable()
      table.text('address').notNullable()
      table.string('postal_code').notNullable().defaultTo('')
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
