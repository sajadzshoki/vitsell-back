import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'static_pages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('source_id').nullable()
      table.string('status').notNullable().defaultTo('published')
      table.jsonb('seo').nullable()
      table.timestamp('published_at', { useTz: true }).nullable()
      table.string('template').notNullable().defaultTo('default')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('source_id')
      table.dropColumn('status')
      table.dropColumn('seo')
      table.dropColumn('published_at')
      table.dropColumn('template')
    })
  }
}
