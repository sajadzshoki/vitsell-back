import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string('parent_id')
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
      table.string('status').notNullable().defaultTo('active')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.jsonb('seo').nullable()
      table.index(['parent_id'])
      table.index(['status'])
      table.index(['sort_order'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['parent_id'])
      table.dropIndex(['status'])
      table.dropIndex(['sort_order'])
      table.dropForeign(['parent_id'])
      table.dropColumn('parent_id')
      table.dropColumn('status')
      table.dropColumn('sort_order')
      table.dropColumn('seo')
    })
  }
}
