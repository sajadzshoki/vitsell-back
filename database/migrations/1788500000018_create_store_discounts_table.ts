import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_discounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.text('description').notNullable().defaultTo('')
      table.string('type').notNullable().defaultTo('percent')
      table.integer('value').notNullable().defaultTo(0)
      table.integer('min_order').notNullable().defaultTo(0)
      table.integer('max_discount').nullable()
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').notNullable()
      table.string('status').notNullable().defaultTo('active')
      table.integer('usage_limit').nullable()
      table.integer('usage_count').notNullable().defaultTo(0)
      table.integer('per_customer_limit').nullable()
      table.integer('priority').notNullable().defaultTo(100)
      table.text('targeting').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status'])
      table.index(['type'])
      table.index(['priority'])
      table.index(['starts_at'])
      table.index(['ends_at'])
      table.index(['name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
