import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_attributes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.string('type').notNullable().defaultTo('select')
      table.text('values').notNullable().defaultTo('[]')
      table.string('status').notNullable().defaultTo('active')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.boolean('filterable').notNullable().defaultTo(true)
      table.boolean('searchable').notNullable().defaultTo(false)
      table.boolean('variant_defining').notNullable().defaultTo(true)
      table.text('category_ids').notNullable().defaultTo('[]')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['status'])
      table.index(['type'])
      table.index(['sort_order'])
      table.index(['filterable'])
      table.index(['variant_defining'])
    })

    this.defer(async (db) => {
      const now = new Date()
      const rows = [
        {
          id: 'attr-color',
          name: 'رنگ',
          slug: 'color',
          type: 'color',
          status: 'active',
          sort_order: 0,
          filterable: true,
          searchable: false,
          variant_defining: true,
          category_ids: JSON.stringify(['mobile', 'fashion']),
          values: JSON.stringify([
            { id: 'color-red', label: 'قرمز', value: 'red', meta: '#b91c1c', sortOrder: 0, status: 'active' },
            { id: 'color-blue', label: 'آبی', value: 'blue', meta: '#2563eb', sortOrder: 1, status: 'active' },
            { id: 'color-black', label: 'مشکی', value: 'black', meta: '#1c1c1e', sortOrder: 2, status: 'active' },
            { id: 'color-white', label: 'سفید', value: 'white', meta: '#f5f5f0', sortOrder: 3, status: 'active' },
          ]),
        },
        {
          id: 'attr-size',
          name: 'سایز',
          slug: 'size',
          type: 'select',
          status: 'active',
          sort_order: 1,
          filterable: true,
          searchable: false,
          variant_defining: true,
          category_ids: JSON.stringify(['fashion']),
          values: JSON.stringify([
            { id: 'size-s', label: 'S', value: 's', sortOrder: 0, status: 'active' },
            { id: 'size-m', label: 'M', value: 'm', sortOrder: 1, status: 'active' },
            { id: 'size-l', label: 'L', value: 'l', sortOrder: 2, status: 'active' },
            { id: 'size-xl', label: 'XL', value: 'xl', sortOrder: 3, status: 'active' },
          ]),
        },
        {
          id: 'attr-storage',
          name: 'حافظه داخلی',
          slug: 'storage',
          type: 'select',
          status: 'active',
          sort_order: 2,
          filterable: true,
          searchable: false,
          variant_defining: true,
          category_ids: JSON.stringify(['mobile', 'laptop']),
          values: JSON.stringify([
            { id: 'st-128', label: '۱۲۸ گیگابایت', value: '128gb', sortOrder: 0, status: 'active' },
            { id: 'st-256', label: '۲۵۶ گیگابایت', value: '256gb', sortOrder: 1, status: 'active' },
            { id: 'st-512', label: '۵۱۲ گیگابایت', value: '512gb', sortOrder: 2, status: 'active' },
          ]),
        },
        {
          id: 'attr-ram',
          name: 'رم',
          slug: 'ram',
          type: 'select',
          status: 'active',
          sort_order: 3,
          filterable: true,
          searchable: false,
          variant_defining: true,
          category_ids: JSON.stringify(['mobile', 'laptop']),
          values: JSON.stringify([
            { id: 'ram-8', label: '۸ گیگابایت', value: '8gb', sortOrder: 0, status: 'active' },
            { id: 'ram-12', label: '۱۲ گیگابایت', value: '12gb', sortOrder: 1, status: 'active' },
            { id: 'ram-16', label: '۱۶ گیگابایت', value: '16gb', sortOrder: 2, status: 'active' },
          ]),
        },
      ]

      for (const row of rows) {
        await db.table(this.tableName).insert({
          ...row,
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
