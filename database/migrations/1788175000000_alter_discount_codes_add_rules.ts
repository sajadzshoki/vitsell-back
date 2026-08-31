import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'discount_codes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('starts_at', { useTz: true }).nullable()
      table.timestamp('ends_at', { useTz: true }).nullable()
      table.bigInteger('min_amount').notNullable().defaultTo(0)
      table.boolean('once_per_user').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('starts_at')
      table.dropColumn('ends_at')
      table.dropColumn('min_amount')
      table.dropColumn('once_per_user')
    })
  }
}
