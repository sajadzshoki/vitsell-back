import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'brands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.string('logo').nullable()
      table.text('description').notNullable().defaultTo('')
      table.string('status').notNullable().defaultTo('active')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.text('seo').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status'])
      table.index(['sort_order'])
      table.index(['name'])
    })

    this.defer(async (db) => {
      const names = [
        'Apple',
        'Samsung',
        'Xiaomi',
        'Sony',
        'LG',
        'ASUS',
        'Lenovo',
        'HP',
        'Nike',
        'Adidas',
        'Canon',
        'JBL',
        'Huawei',
        'Dell',
      ]
      const now = new Date()
      for (let i = 0; i < names.length; i++) {
        const name = names[i]!
        const slug = name.toLowerCase().replace(/\s+/g, '-')
        await db.table(this.tableName).insert({
          id: `brand-${slug}`,
          name,
          slug,
          logo: null,
          description: '',
          status: 'active',
          sort_order: i,
          seo: null,
          created_at: now,
          updated_at: now,
        })
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
