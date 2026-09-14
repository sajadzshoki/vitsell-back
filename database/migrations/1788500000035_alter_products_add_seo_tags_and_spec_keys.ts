import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('seo').nullable()
      table.jsonb('tags').notNullable().defaultTo('[]')
    })

    this.schema.createTable('category_spec_keys', (table) => {
      table.string('id').primary()
      table
        .string('category_id')
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')
        .index()
      table.string('key').notNullable()
      table.integer('usage_count').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['category_id', 'key'])
    })
  }

  async down() {
    this.schema.dropTable('category_spec_keys')
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('seo')
      table.dropColumn('tags')
    })
  }
}
