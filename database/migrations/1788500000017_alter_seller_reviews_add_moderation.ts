import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_reviews'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('moderation').notNullable().defaultTo('approved').index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('moderation')
    })
  }
}
