import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('product_reviews', (table) => {
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .index()
    })

    this.schema.alterTable('product_questions', (table) => {
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .index()
    })
  }

  async down() {
    this.schema.alterTable('product_reviews', (table) => {
      table.dropColumn('user_id')
    })
    this.schema.alterTable('product_questions', (table) => {
      table.dropColumn('user_id')
    })
  }
}
