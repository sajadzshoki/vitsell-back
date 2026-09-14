import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('barcode', 120).nullable()
      table.string('weight', 64).nullable()
      table.jsonb('variant_axes').nullable()
      table.jsonb('variants').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('barcode')
      table.dropColumn('weight')
      table.dropColumn('variant_axes')
      table.dropColumn('variants')
    })
  }
}
