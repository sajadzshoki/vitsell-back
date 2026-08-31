/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  FRONTEND_URL: Env.schema.string({ format: 'url', tld: false }),
  /** Admin panel origin (e.g. https://admin.digishop.ir). Set in production. */
  ADMIN_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  KAVENEGAR_API_KEY: Env.schema.string.optional(),
  KAVENEGAR_OTP_TEMPLATE: Env.schema.string.optional(),

  ZARINPAL_MERCHANT_ID: Env.schema.string.optional(),
  ZARINPAL_SANDBOX: Env.schema.boolean.optional(),
  ZARINPAL_CALLBACK_URL: Env.schema.string.optional(),
})
