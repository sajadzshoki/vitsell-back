import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('cart_items', (table) => {
      table.dropUnique(['user_id', 'product_id'])
      table.string('variant_id').nullable()
      table.unique(['user_id', 'product_id', 'variant_id'])
    })
  }

  async down() {
    this.schema.alterTable('cart_items', (table) => {
      table.dropUnique(['user_id', 'product_id', 'variant_id'])
      table.dropColumn('variant_id')
      table.unique(['user_id', 'product_id'])
    })
  }
}
