import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Independent navigation layer for storefront Mega Menu.
 * Additive only — does not alter categories / products / product_attributes.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('mega_menus', (table) => {
      table.string('id').primary()
      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.string('icon').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status'])
      table.index(['sort_order'])
    })

    this.schema.createTable('mega_menu_sections', (table) => {
      table.string('id').primary()
      table
        .string('menu_id')
        .notNullable()
        .references('id')
        .inTable('mega_menus')
        .onDelete('CASCADE')
      table
        .string('parent_id')
        .nullable()
        .references('id')
        .inTable('mega_menu_sections')
        .onDelete('CASCADE')
      table.string('title').notNullable()
      table
        .string('category_id')
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['menu_id'])
      table.index(['parent_id'])
      table.index(['status'])
      table.index(['sort_order'])
    })

    this.schema.createTable('mega_menu_items', (table) => {
      table.string('id').primary()
      table
        .string('section_id')
        .notNullable()
        .references('id')
        .inTable('mega_menu_sections')
        .onDelete('CASCADE')
      table.string('title').notNullable()
      /** category | filter | link */
      table.string('type').notNullable()
      table
        .string('category_id')
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')
      /**
       * Navigation filter definition aligned with CatalogFilterInput
       * (category, brands, minPrice, maxPrice, attrs, q, …).
       * Execution stays on GET /products + catalog_filters — not a parallel filter engine.
       */
      table.text('filter').nullable()
      table.string('url').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['section_id'])
      table.index(['type'])
      table.index(['status'])
      table.index(['sort_order'])
    })
  }

  async down() {
    this.schema.dropTable('mega_menu_items')
    this.schema.dropTable('mega_menu_sections')
    this.schema.dropTable('mega_menus')
  }
}
