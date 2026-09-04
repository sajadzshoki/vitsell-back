import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_shipping_methods'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('name').notNullable()
      table.string('carrier').notNullable().defaultTo('')
      table.string('estimated_days').notNullable().defaultTo('')
      table.bigInteger('base_cost').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('active').index()
      table.integer('sort_order').notNullable().defaultTo(0).index()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.defer(async (db) => {
      const now = new Date()
      await db.table(this.tableName).multiInsert([
        {
          id: 'ship-express',
          name: 'پیک اکسپرس',
          carrier: 'دیجی‌شاپ',
          estimated_days: '۱–۲ روز',
          base_cost: 45000,
          status: 'active',
          sort_order: 1,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'ship-tipax',
          name: 'تیپاکس',
          carrier: 'تیپاکس',
          estimated_days: '۲–۴ روز',
          base_cost: 85000,
          status: 'active',
          sort_order: 2,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'ship-post',
          name: 'پست پیشتاز',
          carrier: 'پست ایران',
          estimated_days: '۳–۵ روز',
          base_cost: 40000,
          status: 'active',
          sort_order: 3,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'ship-pickup',
          name: 'دریافت حضوری',
          carrier: 'فروشگاه',
          estimated_days: 'همان روز',
          base_cost: 0,
          status: 'active',
          sort_order: 4,
          created_at: now,
          updated_at: now,
        },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
