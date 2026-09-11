import { BaseSchema } from '@adonisjs/lucid/schema'

/** SEO path segments for storefront `/category/{menu}/{section}/…/{item}` */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('mega_menu_sections', (table) => {
      table.string('slug').nullable()
      table.index(['menu_id', 'slug'])
    })

    this.schema.alterTable('mega_menu_items', (table) => {
      table.string('slug').nullable()
      table.index(['section_id', 'slug'])
    })
  }

  async down() {
    this.schema.alterTable('mega_menu_items', (table) => {
      table.dropIndex(['section_id', 'slug'])
      table.dropColumn('slug')
    })
    this.schema.alterTable('mega_menu_sections', (table) => {
      table.dropIndex(['menu_id', 'slug'])
      table.dropColumn('slug')
    })
  }
}
