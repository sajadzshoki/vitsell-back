import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('featured').notNullable().defaultTo(false)
      table.boolean('published').notNullable().defaultTo(true)
      table.boolean('has_variants').notNullable().defaultTo(false)
      table.string('sku').nullable()
      table.integer('low_stock_threshold').notNullable().defaultTo(5)
    })

    this.defer(async (db) => {
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS products_featured_index ON products (featured)'
      )
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS products_published_index ON products (published)'
      )
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS seller_listings_status_index ON seller_listings (status)'
      )
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS seller_listings_stock_index ON seller_listings (stock)'
      )
      await db.rawQuery(
        'CREATE INDEX IF NOT EXISTS seller_listings_created_at_index ON seller_listings (created_at)'
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('featured')
      table.dropColumn('published')
      table.dropColumn('has_variants')
      table.dropColumn('sku')
      table.dropColumn('low_stock_threshold')
    })
  }
}
