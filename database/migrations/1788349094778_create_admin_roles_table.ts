import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
  
      table.string('key').notNullable().unique()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.boolean('is_system').notNullable().defaultTo(false)
  
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}