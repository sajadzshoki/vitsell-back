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
  /** Admin panel origin (e.g. https://admin.vitsell.ir). Set in production. */
  ADMIN_URL: Env.schema.string.optional({ format: 'url', tld: false }),
  /** Deployed API version exposed by GET /health (health checkers / uptime). */
  APP_VERSION: Env.schema.string(),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  /**
   * Drive / MinIO (S3-compatible). Default disk is `s3` locally & in prod.
   * Use `fs` in CI or when MinIO is unavailable.
   */
  DRIVE_DISK: Env.schema.enum(['fs', 's3'] as const),
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  /** Internal API endpoint (e.g. http://127.0.0.1:9000 or http://minio:9000). */
  S3_ENDPOINT: Env.schema.string.optional(),
  /**
   * Browser-facing base URL for objects (path-style): http://127.0.0.1:9000/vitsell
   * When set with DRIVE_DISK=s3, media JSON returns this URL instead of /uploads/...
   */
  S3_PUBLIC_URL: Env.schema.string.optional(),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  KAVENEGAR_API_KEY: Env.schema.string.optional(),
  KAVENEGAR_OTP_TEMPLATE: Env.schema.string.optional(),
  ALLOW_OTP_MOCK: Env.schema.boolean.optional(),

  ZARINPAL_MERCHANT_ID: Env.schema.string.optional(),
  ZARINPAL_SANDBOX: Env.schema.boolean.optional(),
  ZARINPAL_CALLBACK_URL: Env.schema.string.optional(),
  ALLOW_PAYMENT_MOCK: Env.schema.boolean.optional(),

  /** Technolife product importer (optional; defaults applied in config/technolife.ts) */
  TECHNOLIFE_ENABLED: Env.schema.boolean.optional(),
  TECHNOLIFE_REQUEST_DELAY_MS: Env.schema.number.optional(),
  TECHNOLIFE_TIMEOUT_MS: Env.schema.number.optional(),
  TECHNOLIFE_MAX_RETRIES: Env.schema.number.optional(),
  TECHNOLIFE_CONCURRENCY: Env.schema.number.optional(),
  TECHNOLIFE_MAX_IMAGES: Env.schema.number.optional(),
  TECHNOLIFE_DEFAULT_STOCK: Env.schema.number.optional(),
  TECHNOLIFE_DEFAULT_CATEGORY_ID: Env.schema.string.optional(),
  TECHNOLIFE_DEFAULT_CATEGORY_URL: Env.schema.string.optional(),
  TECHNOLIFE_MAX_CATEGORY_IMPORT: Env.schema.number.optional(),
  TECHNOLIFE_UPDATE_PRICE: Env.schema.boolean.optional(),
  TECHNOLIFE_UPDATE_INVENTORY: Env.schema.boolean.optional(),
  TECHNOLIFE_UPDATE_DESCRIPTION: Env.schema.boolean.optional(),
  TECHNOLIFE_UPDATE_IMAGES: Env.schema.boolean.optional(),
  TECHNOLIFE_UPDATE_SPECS: Env.schema.boolean.optional(),
})
