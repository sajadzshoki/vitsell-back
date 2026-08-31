import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('image').nullable()
      table.text('text').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image')
      table.dropColumn('text')
    })
  }
}
