import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_shops'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.string('phone').notNullable()
      table.string('email').notNullable()
      table.string('city').notNullable()
      table.text('about').notNullable().defaultTo('')
      table.float('rating').notNullable().defaultTo(0)
      table.integer('review_count').notNullable().defaultTo(0)
      table.string('join_date').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
