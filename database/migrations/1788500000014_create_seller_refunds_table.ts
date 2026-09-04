import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_refunds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('order_id').notNullable().index()
      table.string('return_id').nullable().index()
      table.string('customer_name').notNullable().defaultTo('')
      table
        .enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])
        .notNullable()
        .defaultTo('pending')
        .index()
      table.bigInteger('amount').notNullable()
      table.bigInteger('order_total').notNullable().defaultTo(0)
      table.bigInteger('already_refunded').notNullable().defaultTo(0)
      table.text('reason').notNullable().defaultTo('')
      table.string('transaction_id').notNullable().defaultTo('')
      table.jsonb('items').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.defer(async (db) => {
      const orders = await db
        .from('seller_orders')
        .where('refunded_amount', '>', 0)
        .orWhereRaw(`jsonb_array_length(COALESCE(refunds, '[]'::jsonb)) > 0`)
        .limit(50)

      const now = new Date()
      for (const order of orders as any[]) {
        const embedded = Array.isArray(order.refunds)
          ? order.refunds
          : typeof order.refunds === 'string'
            ? JSON.parse(order.refunds || '[]')
            : []
        if (embedded.length) {
          for (const r of embedded) {
            await db.table(this.tableName).insert({
              id: String(r.id || `RF-${Date.now().toString(36).toUpperCase()}`),
              order_id: order.id,
              return_id: null,
              customer_name: order.customer_name || '',
              status: r.status || 'completed',
              amount: Number(r.amount) || 0,
              order_total: Number(order.total) || 0,
              already_refunded: Number(order.refunded_amount) || 0,
              reason: r.reason || 'بازپرداخت',
              transaction_id: r.transactionId || '',
              items: JSON.stringify([]),
              created_at: r.createdAt ? new Date(r.createdAt) : now,
              updated_at: now,
            })
          }
        }
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
