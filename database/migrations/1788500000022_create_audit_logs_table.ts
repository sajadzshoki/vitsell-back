import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .integer('actor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('actor_name').notNullable().defaultTo('')
      table.string('action').notNullable()
      table.string('entity').notNullable()
      table.string('entity_id').notNullable().defaultTo('')
      table.text('summary').notNullable()
      table.text('previous_value').nullable()
      table.text('new_value').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index(['created_at'])
      table.index(['action'])
      table.index(['entity'])
      table.index(['actor_id'])
      table.index(['entity_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
