import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_returns'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('photos').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('photos')
    })
  }
}
