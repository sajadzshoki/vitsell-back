import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'banners'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('aspect_desktop', 16).notNullable().defaultTo('4/1')
      table.string('aspect_mobile', 16).notNullable().defaultTo('3/1')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('aspect_desktop')
      table.dropColumn('aspect_mobile')
    })
  }
}
