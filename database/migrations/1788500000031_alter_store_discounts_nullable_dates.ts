import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_discounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('starts_at').nullable().alter()
      table.timestamp('ends_at').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('starts_at').notNullable().alter()
      table.timestamp('ends_at').notNullable().alter()
    })
  }
}
