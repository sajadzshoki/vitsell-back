import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warehouses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.string('code').notNullable().unique()
      table.string('city').notNullable().defaultTo('')
      table.text('address').notNullable().defaultTo('')
      table.string('status').notNullable().defaultTo('active').index()
      table.boolean('is_default').notNullable().defaultTo(false).index()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.defer(async (db) => {
      const now = new Date()
      await db.table(this.tableName).multiInsert([
        {
          id: 'wh-tehran',
          name: 'انبار مرکزی تهران',
          code: 'THR-01',
          city: 'تهران',
          address: 'تهران، انبار مرکزی',
          status: 'active',
          is_default: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'wh-karaj',
          name: 'انبار کرج',
          code: 'KRJ-01',
          city: 'کرج',
          address: 'کرج، انبار غرب',
          status: 'active',
          is_default: false,
          created_at: now,
          updated_at: now,
        },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
