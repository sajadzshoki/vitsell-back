import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'content_promos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('eyebrow').notNullable().defaultTo('')
      table.string('title').notNullable()
      table.text('subtitle').notNullable()
      table.string('tone').notNullable().defaultTo('primary')
      table.string('icon').notNullable().defaultTo('sparkles')
      table.string('primary_cta_label').notNullable()
      table.string('primary_cta_to').nullable()
      table.string('secondary_cta_label').nullable()
      table.string('secondary_cta_to').nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
