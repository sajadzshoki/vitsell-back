import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_payouts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('fees').notNullable().defaultTo(0)
      table.string('gateway').notNullable().defaultTo('زرین‌پال')
      table.string('source').notNullable().defaultTo('gateway')
      table.string('reference').notNullable().defaultTo('')
      table.text('note').nullable()
      table
        .string('settlement_status')
        .notNullable()
        .defaultTo('pending')
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE seller_payouts
        SET settlement_status = CASE
          WHEN status = 'paid' THEN 'completed'
          ELSE 'pending'
        END,
        fees = GREATEST(ROUND(amount * 0.01), 0)
        WHERE settlement_status = 'pending' OR settlement_status IS NULL
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fees')
      table.dropColumn('gateway')
      table.dropColumn('source')
      table.dropColumn('reference')
      table.dropColumn('note')
      table.dropColumn('settlement_status')
    })
  }
}
