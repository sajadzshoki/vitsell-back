import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('source', 64).nullable()
      table.text('source_url').nullable()
      table.string('source_product_id', 128).nullable()
      table.timestamp('source_imported_at', { useTz: true }).nullable()
      table.timestamp('source_updated_at', { useTz: true }).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS products_source_product_id_index ON products (source, source_product_id)'
      )
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS products_source_url_index ON products (source_url)'
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('source')
      table.dropColumn('source_url')
      table.dropColumn('source_product_id')
      table.dropColumn('source_imported_at')
      table.dropColumn('source_updated_at')
    })
  }
}
