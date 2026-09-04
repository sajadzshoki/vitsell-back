import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media_assets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('url').notNullable()
      table.string('filename').notNullable()
      table.string('mime_type').notNullable().defaultTo('application/octet-stream')
      table.string('kind').notNullable().defaultTo('image')
      table.string('alt').notNullable().defaultTo('')
      table.string('title').notNullable().defaultTo('')
      table.text('description').notNullable().defaultTo('')
      table.integer('width').nullable()
      table.integer('height').nullable()
      table.bigInteger('size_bytes').nullable()
      table.jsonb('usage_hints').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['kind'])
      table.index(['created_at'])
      table.index(['filename'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
