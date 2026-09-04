import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'banners'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('title').notNullable().defaultTo('')
      table.string('internal_name').notNullable()
      table.string('alt').notNullable().defaultTo('')
      table.string('image').notNullable()
      table.string('image_mobile').nullable()
      table.string('link').notNullable().defaultTo('')
      table.string('link_type').notNullable().defaultTo('url')
      table.string('product_id').nullable()
      table.string('brand_id').nullable()
      table.string('campaign_id').nullable()
      table.string('type').notNullable().defaultTo('main')
      table.string('placement').notNullable().defaultTo('homepage_hero')
      table.string('category_id').nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('starts_at', { useTz: true }).nullable()
      table.timestamp('ends_at', { useTz: true }).nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.integer('priority').notNullable().defaultTo(100)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['placement', 'active'])
      table.index(['sort_order'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
