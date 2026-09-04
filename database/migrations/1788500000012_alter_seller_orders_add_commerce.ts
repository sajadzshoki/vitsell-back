import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tracking_code').notNullable().defaultTo('')
      table.string('carrier').notNullable().defaultTo('')
      table.string('estimated_delivery').notNullable().defaultTo('')
      table.jsonb('timeline').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.jsonb('internal_notes').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.jsonb('refunds').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.bigInteger('refunded_amount').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tracking_code')
      table.dropColumn('carrier')
      table.dropColumn('estimated_delivery')
      table.dropColumn('timeline')
      table.dropColumn('internal_notes')
      table.dropColumn('refunds')
      table.dropColumn('refunded_amount')
    })
  }
}
