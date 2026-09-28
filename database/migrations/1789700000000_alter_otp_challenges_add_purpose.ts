import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'otp_challenges'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('purpose', 32).notNullable().defaultTo('login')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('purpose')
    })
  }
}
