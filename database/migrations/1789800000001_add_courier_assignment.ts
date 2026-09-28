import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const typeRow = await db.rawQuery(`
        SELECT t.typname AS type_name
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'users'
          AND a.attname = 'role'
          AND t.typtype = 'e'
          AND a.attnum > 0
          AND NOT a.attisdropped
      `)
      const typeName = typeRow.rows?.[0]?.type_name as string | undefined
      if (typeName) {
        await db.rawQuery(`ALTER TYPE "${typeName.replace(/"/g, '')}" ADD VALUE IF NOT EXISTS 'courier'`)
        return
      }

      const checks = await db.rawQuery(`
        SELECT con.conname AS name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'users'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%role%'
      `)
      for (const row of checks.rows || []) {
        const name = String(row.name || '')
        if (!name) continue
        await db.rawQuery(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${name.replace(/"/g, '')}"`)
      }
      await db.rawQuery(`
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('customer', 'seller', 'admin', 'courier'))
      `)
    })

    this.schema.alterTable('seller_orders', (table) => {
      table
        .integer('courier_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('delivery_code', 6).notNullable().defaultTo('')
      table.integer('delivery_attempt_count').notNullable().defaultTo(0)
      table.timestamp('delivery_attempt_reset_at', { useTz: true }).nullable()
      table.index(['courier_id'])
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE seller_orders
        SET delivery_code = lpad((floor(random() * 1000000))::int::text, 6, '0')
        WHERE delivery_code IS NULL OR delivery_code = ''
      `)
    })
  }

  async down() {
    this.schema.alterTable('seller_orders', (table) => {
      table.dropForeign(['courier_id'])
      table.dropColumn('courier_id')
      table.dropColumn('delivery_code')
      table.dropColumn('delivery_attempt_count')
      table.dropColumn('delivery_attempt_reset_at')
    })

    this.defer(async (db) => {
      await db.rawQuery(`UPDATE users SET role = 'customer' WHERE role = 'courier'`)
      const typeRow = await db.rawQuery(`
        SELECT t.typname AS type_name
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'users'
          AND a.attname = 'role'
          AND t.typtype = 'e'
      `)
      if (typeRow.rows?.[0]?.type_name) return
      await db.rawQuery(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
      await db.rawQuery(`
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('customer', 'seller', 'admin'))
      `)
    })
  }
}
