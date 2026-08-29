import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_questions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .string('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
        .index()
      table.string('name').notNullable()
      table.string('date').notNullable()
      table.boolean('verified').notNullable().defaultTo(false)
      table.text('question').notNullable()
      table.jsonb('answer').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
