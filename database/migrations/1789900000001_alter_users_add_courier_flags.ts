import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_courier').notNullable().defaultTo(false)
      table.boolean('courier_active').notNullable().defaultTo(false)
      table.string('courier_name').nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE users
        SET
          is_courier = true,
          courier_active = (status = 'active'),
          courier_name = COALESCE(courier_name, '')
        WHERE role = 'courier'
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_courier')
      table.dropColumn('courier_active')
      table.dropColumn('courier_name')
    })
  }
}
