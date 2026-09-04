import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_campaigns'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('scheduled_at', { useTz: true }).nullable()
      table.string('type').notNullable().defaultTo('announcement')
      table.string('image').nullable()
      table.jsonb('related_entity').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('scheduled_at')
      table.dropColumn('type')
      table.dropColumn('image')
      table.dropColumn('related_entity')
    })
  }
}
