import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_movements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('product_id').notNullable().index()
      table.string('product_title').notNullable().defaultTo('')
      table.string('variant_id').nullable()
      table.string('variant_label').nullable()
      table.string('warehouse_id').notNullable().index()
      table.string('type').notNullable().index()
      table.integer('quantity').notNullable()
      table.integer('before').notNullable().defaultTo(0)
      table.integer('after').notNullable().defaultTo(0)
      table.text('reason').notNullable().defaultTo('')
      table.string('actor_name').notNullable().defaultTo('')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
