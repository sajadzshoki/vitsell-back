import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'])

/** Normalize to `https://host:port` origin only (no path/query). */
export function normalizeReturnOrigin(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim()
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url.origin
  } catch {
    return null
  }
}

function configuredOrigins(): Set<string> {
  const origins = new Set<string>()
  for (const key of ['FRONTEND_URL', 'ADMIN_URL'] as const) {
    const value = env.get(key)
    if (!value) continue
    const origin = normalizeReturnOrigin(value)
    if (origin) origins.add(origin)
  }
  const extra = String(env.get('PAYMENT_RETURN_ORIGINS') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const item of extra) {
    const origin = normalizeReturnOrigin(item)
    if (origin) origins.add(origin)
  }
  return origins
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

/**
 * Storefront base for post-Zarinpal redirects.
 * Prefers the origin the shopper actually used (checkout/wallet request),
 * falls back to FRONTEND_URL. Blocks open redirects via allowlist; if
 * FRONTEND_URL is misconfigured as localhost on a public deploy, a public
 * https candidate from the client is accepted with a warning.
 */
export function resolvePaymentReturnBase(
  ...candidates: Array<string | null | undefined>
): string {
  const fallback = env.get('FRONTEND_URL').replace(/\/$/, '')
  const allowed = configuredOrigins()

  for (const raw of candidates) {
    const origin = normalizeReturnOrigin(raw)
    if (!origin) continue

    if (allowed.has(origin)) return origin

    if (isLoopbackOrigin(fallback) && !isLoopbackOrigin(origin)) {
      logger.warn(
        { origin, frontendUrl: fallback },
        '[payment] FRONTEND_URL is loopback; using client storefront origin for Zarinpal return'
      )
      return origin
    }
  }

  return fallback
}

/** Build Zarinpal callback URL that carries the storefront origin for the final redirect. */
export function zarinpalCallbackUrlWithReturn(
  path: '/api/v1/payments/zarinpal/callback' | '/api/v1/payments/zarinpal/wallet-callback',
  returnBase: string
): string {
  const appUrl = env
    .get('APP_URL')
    .replace(/\/$/, '')
    .replace(/\/\/0\.0\.0\.0(?=[:/]|$)/, '//localhost')
    .replace(/\/\/\[::\](?=[:/]|$)/, '//localhost')
  const configured = env.get('ZARINPAL_CALLBACK_URL')
  // Wallet always uses its own path; checkout may override via ZARINPAL_CALLBACK_URL.
  const base =
    path.includes('wallet')
      ? `${appUrl}${path}`
      : (configured || `${appUrl}${path}`).replace(/\/$/, '')

  const url = new URL(base)
  url.searchParams.set('ro', resolvePaymentReturnBase(returnBase))
  return url.toString()
}
