import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_reviews'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('images').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('images')
    })
  }
}
