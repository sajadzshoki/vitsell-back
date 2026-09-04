import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_listings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('warehouse_id').nullable().index()
      table.integer('reserved').notNullable().defaultTo(0)
    })

    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('warehouse_id').update({ warehouse_id: 'wh-tehran' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('warehouse_id')
      table.dropColumn('reserved')
    })
  }
}
