import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('product_import_batches', (table) => {
      table.increments('id').notNullable()
      table.string('source', 64).notNullable().defaultTo('technolife')
      table.string('status', 32).notNullable().defaultTo('pending')
      table.string('mode', 32).notNullable().defaultTo('create_only')
      table.jsonb('config').nullable()
      table.integer('total_count').notNullable().defaultTo(0)
      table.integer('success_count').notNullable().defaultTo(0)
      table.integer('failed_count').notNullable().defaultTo(0)
      table.integer('duplicate_count').notNullable().defaultTo(0)
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('product_import_items', (table) => {
      table.increments('id').notNullable()
      table
        .integer('batch_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product_import_batches')
        .onDelete('CASCADE')
      table.string('source', 64).notNullable().defaultTo('technolife')
      table.text('source_url').notNullable()
      table.string('source_product_id', 128).nullable()
      table.string('status', 32).notNullable().defaultTo('pending')
      table.string('product_id').nullable()
      table.string('error_code', 64).nullable()
      table.text('error_message').nullable()
      table.jsonb('warnings').nullable()
      table.jsonb('result').nullable()
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['batch_id'])
      table.index(['status'])
      table.index(['source_product_id'])
    })
  }

  async down() {
    this.schema.dropTable('product_import_items')
    this.schema.dropTable('product_import_batches')
  }
}
