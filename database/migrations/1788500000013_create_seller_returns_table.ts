import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_returns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('order_id').notNullable().index()
      table.string('customer_id').notNullable().defaultTo('')
      table.string('customer_name').notNullable().defaultTo('')
      table
        .enum('status', [
          'requested',
          'approved',
          'rejected',
          'received',
          'processing',
          'completed',
          'cancelled',
        ])
        .notNullable()
        .defaultTo('requested')
        .index()
      table.text('reason').notNullable().defaultTo('')
      table.text('admin_note').notNullable().defaultTo('')
      table.timestamp('requested_at').notNullable()
      table.jsonb('items').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.defer(async (db) => {
      const order = await db.from('seller_orders').orderBy('created_at', 'desc').first()
      if (!order) return
      const now = new Date()
      const items = Array.isArray(order.items)
        ? order.items
        : typeof order.items === 'string'
          ? JSON.parse(order.items)
          : []
      const first = items[0]
      await db.table(this.tableName).insert({
        id: 'RET-1001',
        order_id: order.id,
        customer_id: '',
        customer_name: order.customer_name || 'مشتری',
        status: 'requested',
        reason: 'درخواست مرجوعی نمونه',
        admin_note: '',
        requested_at: now,
        items: JSON.stringify(
          first
            ? [
                {
                  productId: first.productId,
                  productTitle: first.productId,
                  variantLabel: null,
                  sku: first.productId,
                  qty: first.qty || 1,
                  unitPrice: first.price || 0,
                },
              ]
            : [],
        ),
        created_at: now,
        updated_at: now,
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
