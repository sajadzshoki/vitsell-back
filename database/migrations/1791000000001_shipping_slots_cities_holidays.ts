import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('seller_shipping_methods', (table) => {
      table.string('coverage').notNullable().defaultTo('nationwide').index()
      table.boolean('slots_enabled').notNullable().defaultTo(false)
      table.string('holiday_mode').notNullable().defaultTo('use_weekday')
      table.boolean('express_enabled').notNullable().defaultTo(false)
      table.bigInteger('express_price').notNullable().defaultTo(0)
      table.integer('express_deadline_hour').notNullable().defaultTo(12)
    })

    this.schema.createTable('seller_shipping_method_cities', (table) => {
      table.increments('id').primary()
      table
        .string('method_id')
        .notNullable()
        .references('id')
        .inTable('seller_shipping_methods')
        .onDelete('CASCADE')
        .index()
      table.string('province').notNullable()
      table.string('city').notNullable()
      table.bigInteger('price').notNullable().defaultTo(0)
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['method_id', 'province', 'city'])
    })

    this.schema.createTable('seller_shipping_weekday_slots', (table) => {
      table.increments('id').primary()
      table
        .string('method_id')
        .notNullable()
        .references('id')
        .inTable('seller_shipping_methods')
        .onDelete('CASCADE')
        .index()
      /** 0=شنبه … 6=جمعه */
      table.integer('weekday').notNullable().index()
      table.string('start_time', 5).notNullable()
      table.string('end_time', 5).notNullable()
      table.integer('capacity').notNullable().defaultTo(20)
      table.bigInteger('price_override').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('seller_shipping_day_overrides', (table) => {
      table.increments('id').primary()
      table
        .string('method_id')
        .notNullable()
        .references('id')
        .inTable('seller_shipping_methods')
        .onDelete('CASCADE')
        .index()
      table.date('date').notNullable().index()
      table.boolean('is_closed').notNullable().defaultTo(false)
      table.boolean('use_custom_slots').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['method_id', 'date'])
    })

    this.schema.createTable('seller_shipping_day_slots', (table) => {
      table.increments('id').primary()
      table
        .integer('override_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('seller_shipping_day_overrides')
        .onDelete('CASCADE')
        .index()
      table.string('start_time', 5).notNullable()
      table.string('end_time', 5).notNullable()
      table.integer('capacity').notNullable().defaultTo(20)
      table.bigInteger('price_override').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('seller_shipping_holiday_slots', (table) => {
      table.increments('id').primary()
      table
        .string('method_id')
        .notNullable()
        .references('id')
        .inTable('seller_shipping_methods')
        .onDelete('CASCADE')
        .index()
      table.string('start_time', 5).notNullable()
      table.string('end_time', 5).notNullable()
      table.integer('capacity').notNullable().defaultTo(20)
      table.bigInteger('price_override').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('shipping_calendar_holidays', (table) => {
      table.increments('id').primary()
      table.date('date').notNullable().unique()
      table.string('title').notNullable().defaultTo('')
      table.string('source').notNullable().defaultTo('manual')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('shipping_slot_reservations', (table) => {
      table.increments('id').primary()
      table
        .string('method_id')
        .notNullable()
        .references('id')
        .inTable('seller_shipping_methods')
        .onDelete('CASCADE')
        .index()
      table.date('slot_date').notNullable().index()
      table.string('start_time', 5).notNullable()
      table.string('end_time', 5).notNullable()
      table.string('order_id').notNullable().index()
      table.string('status').notNullable().defaultTo('held').index()
      table.boolean('is_express').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['order_id'])
      table.index(['method_id', 'slot_date', 'start_time', 'end_time', 'status'])
    })

    this.schema.alterTable('orders', (table) => {
      table.string('shipping_method_id').nullable().index()
      table.date('shipping_slot_date').nullable()
      table.string('shipping_slot_start', 5).nullable()
      table.string('shipping_slot_end', 5).nullable()
      table.boolean('shipping_is_express').notNullable().defaultTo(false)
    })

    this.defer(async (db) => {
      const now = new Date()
      await db.from('seller_shipping_methods').where('id', 'ship-express').update({
        coverage: 'cities',
        slots_enabled: true,
        express_enabled: true,
        express_price: 75000,
        express_deadline_hour: 12,
        holiday_mode: 'use_weekday',
        updated_at: now,
      })
      await db.from('seller_shipping_methods').where('id', 'ship-post').update({
        coverage: 'nationwide',
        slots_enabled: false,
        updated_at: now,
      })
      await db.from('seller_shipping_methods').where('id', 'ship-tipax').update({
        coverage: 'nationwide',
        slots_enabled: false,
        updated_at: now,
      })
      await db.from('seller_shipping_methods').where('id', 'ship-pickup').update({
        coverage: 'nationwide',
        slots_enabled: false,
        updated_at: now,
      })

      // نمونه بازه‌های پیک اکسپرس (شنبه–پنجشنبه)
      const weekdaySlots: Array<{
        method_id: string
        weekday: number
        start_time: string
        end_time: string
        capacity: number
        sort_order: number
        created_at: Date
        updated_at: Date
      }> = []
      for (let weekday = 0; weekday <= 5; weekday++) {
        weekdaySlots.push(
          {
            method_id: 'ship-express',
            weekday,
            start_time: '09:00',
            end_time: '12:00',
            capacity: 20,
            sort_order: 1,
            created_at: now,
            updated_at: now,
          },
          {
            method_id: 'ship-express',
            weekday,
            start_time: '14:00',
            end_time: '18:00',
            capacity: 20,
            sort_order: 2,
            created_at: now,
            updated_at: now,
          }
        )
      }
      if (weekdaySlots.length) {
        await db.table('seller_shipping_weekday_slots').multiInsert(weekdaySlots)
      }

      // تهران پیش‌فرض برای پیک
      await db.table('seller_shipping_method_cities').insert({
        method_id: 'ship-express',
        province: 'تهران',
        city: 'تهران',
        price: 45000,
        active: true,
        created_at: now,
        updated_at: now,
      })

      // تعطیلات نمونه ۱۴۰۴ / ۲۰۲۵–۲۰۲۶ (تقریبی رسمی)
      const holidays = [
        { date: '2025-03-20', title: 'نوروز', source: 'iran' },
        { date: '2025-03-21', title: 'نوروز', source: 'iran' },
        { date: '2025-03-22', title: 'نوروز', source: 'iran' },
        { date: '2025-03-23', title: 'نوروز', source: 'iran' },
        { date: '2025-04-01', title: 'روز جمهوری اسلامی', source: 'iran' },
        { date: '2025-04-02', title: 'روز طبیعت', source: 'iran' },
        { date: '2025-06-04', title: 'رحلت امام خمینی', source: 'iran' },
        { date: '2025-06-05', title: 'قیام ۱۵ خرداد', source: 'iran' },
        { date: '2026-03-21', title: 'نوروز', source: 'iran' },
        { date: '2026-03-22', title: 'نوروز', source: 'iran' },
        { date: '2026-03-23', title: 'نوروز', source: 'iran' },
        { date: '2026-03-24', title: 'نوروز', source: 'iran' },
        { date: '2026-04-01', title: 'روز جمهوری اسلامی', source: 'iran' },
        { date: '2026-04-02', title: 'روز طبیعت', source: 'iran' },
      ]
      await db.table('shipping_calendar_holidays').multiInsert(
        holidays.map((h) => ({
          ...h,
          created_at: now,
          updated_at: now,
        }))
      )
    })
  }

  async down() {
    this.schema.alterTable('orders', (table) => {
      table.dropColumn('shipping_method_id')
      table.dropColumn('shipping_slot_date')
      table.dropColumn('shipping_slot_start')
      table.dropColumn('shipping_slot_end')
      table.dropColumn('shipping_is_express')
    })
    this.schema.dropTable('shipping_slot_reservations')
    this.schema.dropTable('shipping_calendar_holidays')
    this.schema.dropTable('seller_shipping_holiday_slots')
    this.schema.dropTable('seller_shipping_day_slots')
    this.schema.dropTable('seller_shipping_day_overrides')
    this.schema.dropTable('seller_shipping_weekday_slots')
    this.schema.dropTable('seller_shipping_method_cities')
    this.schema.alterTable('seller_shipping_methods', (table) => {
      table.dropColumn('coverage')
      table.dropColumn('slots_enabled')
      table.dropColumn('holiday_mode')
      table.dropColumn('express_enabled')
      table.dropColumn('express_price')
      table.dropColumn('express_deadline_hour')
    })
  }
}
