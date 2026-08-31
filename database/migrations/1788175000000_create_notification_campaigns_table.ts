import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_campaigns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('link').nullable()
      table.string('icon').notNullable()
      table.string('audience_type').notNullable()
      table.string('audience_group').nullable()
      table.jsonb('user_ids').notNullable().defaultTo('[]')
      table.integer('recipient_count').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('sent')
      table.timestamp('sent_at', { useTz: true }).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.alterTable('notifications', (table) => {
      table
        .string('campaign_id')
        .nullable()
        .references('id')
        .inTable('notification_campaigns')
        .onDelete('CASCADE')
        .index()
    })
  }

  async down() {
    this.schema.alterTable('notifications', (table) => {
      table.dropColumn('campaign_id')
    })
    this.schema.dropTable(this.tableName)
  }
}
