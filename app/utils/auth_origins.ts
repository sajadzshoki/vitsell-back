import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

/** Normalize origin/url for comparison (no trailing slash). */
export function normalizeOrigin(url: string) {
  return url.trim().replace(/\/$/, '')
}

/**
 * Admin auth must come from ADMIN_URL origin (when configured).
 * In development, if ADMIN_URL is unset, requests are allowed.
 */
export function assertAdminPanelRequest({ request, response }: HttpContext): boolean {
  const configured = env.get('ADMIN_URL')
  if (!configured) {
    if (env.get('NODE_ENV') === 'production') {
      response.forbidden({
        errors: [{ message: 'ADMIN_URL تنظیم نشده است' }],
      })
      return false
    }
    return true
  }

  const allowed = normalizeOrigin(configured)
  const origin = normalizeOrigin(String(request.header('origin') || ''))
  const referer = String(request.header('referer') || '')
  const refererOrigin = referer ? normalizeOrigin(new URL(referer).origin) : ''

  if (origin === allowed || refererOrigin === allowed) {
    return true
  }

  response.forbidden({
    errors: [{ message: 'ورود مدیر فقط از دامنه پنل ادمین مجاز است' }],
  })
  return false
}

/**
 * Storefront auth should not be used from the admin panel origin.
 */
export function assertStorefrontRequest({ request, response }: HttpContext): boolean {
  const configured = env.get('ADMIN_URL')
  if (!configured) return true

  const allowed = normalizeOrigin(configured)
  const origin = normalizeOrigin(String(request.header('origin') || ''))
  const referer = String(request.header('referer') || '')
  let refererOrigin = ''
  try {
    refererOrigin = referer ? normalizeOrigin(new URL(referer).origin) : ''
  }
  catch {
    refererOrigin = ''
  }

  if (origin === allowed || refererOrigin === allowed) {
    response.forbidden({
      errors: [{ message: 'از این دامنه فقط ورود مدیر مجاز است' }],
    })
    return false
  }
  return true
}
