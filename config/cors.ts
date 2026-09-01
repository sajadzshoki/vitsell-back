import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

function productionOrigins(): string[] | true {
  const origins = new Set<string>()
  for (const key of ['FRONTEND_URL', 'ADMIN_URL', 'APP_URL'] as const) {
    const value = env.get(key)
    if (!value) continue
    try {
      origins.add(new URL(value).origin)
    }
    catch {
      /* ignore invalid */
    }
  }
  return origins.size ? [...origins] : true
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin.
   * In production, allow FRONTEND_URL + ADMIN_URL (and APP_URL).
   */
  origin: app.inDev ? true : productionOrigins(),

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
