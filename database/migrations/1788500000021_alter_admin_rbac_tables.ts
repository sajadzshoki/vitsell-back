import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('admin_roles', (table) => {
      table.jsonb('permissions').notNullable().defaultTo(this.raw(`'[]'::jsonb`))
      table.string('status').notNullable().defaultTo('active')
    })

    this.schema.createTable('admin_user_roles', (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('admin_roles')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.unique(['user_id', 'role_id'])
      table.index(['user_id'])
      table.index(['role_id'])
    })

    this.schema.alterTable('profiles', (table) => {
      table.string('avatar').nullable()
    })

    this.schema.alterTable('users', (table) => {
      table.timestamp('last_login_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('last_login_at')
    })
    this.schema.alterTable('profiles', (table) => {
      table.dropColumn('avatar')
    })
    this.schema.dropTable('admin_user_roles')
    this.schema.alterTable('admin_roles', (table) => {
      table.dropColumn('permissions')
      table.dropColumn('status')
    })
  }
}
