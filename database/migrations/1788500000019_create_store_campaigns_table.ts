import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'store_campaigns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.text('description').notNullable().defaultTo('')
      table.string('manual_status').notNullable().defaultTo('draft')
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').notNullable()
      table.integer('priority').notNullable().defaultTo(100)
      table.string('image').nullable()
      table.string('landing_url').notNullable().defaultTo('')
      table.string('slug').notNullable().unique()
      table.text('seo').nullable()
      table.text('targeting').nullable()
      table.text('discount_ids').nullable()
      table.text('coupon_codes').nullable()
      table.text('deal_ids').nullable()
      table.text('banner_ids').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['manual_status'])
      table.index(['priority'])
      table.index(['starts_at'])
      table.index(['ends_at'])
      table.index(['name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
