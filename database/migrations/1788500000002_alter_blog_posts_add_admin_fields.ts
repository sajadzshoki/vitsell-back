import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_posts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('popular').notNullable().defaultTo(false)
      table.integer('engagement').notNullable().defaultTo(0)
      table.boolean('active').notNullable().defaultTo(true)
      table.string('status').notNullable().defaultTo('published')
      table.timestamp('published_at', { useTz: true }).nullable()
      table.timestamp('scheduled_at', { useTz: true }).nullable()
      table.boolean('featured').notNullable().defaultTo(false)
      table.string('image_alt').notNullable().defaultTo('')
      table.jsonb('tags').notNullable().defaultTo('[]')
      table.jsonb('related_post_ids').notNullable().defaultTo('[]')
      table.jsonb('seo').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('popular')
      table.dropColumn('engagement')
      table.dropColumn('active')
      table.dropColumn('status')
      table.dropColumn('published_at')
      table.dropColumn('scheduled_at')
      table.dropColumn('featured')
      table.dropColumn('image_alt')
      table.dropColumn('tags')
      table.dropColumn('related_post_ids')
      table.dropColumn('seo')
    })
  }
}
