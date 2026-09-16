import technolifeConfig from '#config/technolife'
import type { TechnolifeImportErrorCode } from '#services/technolife/types'

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata',
])

function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

export type UrlKind = 'product' | 'category'

export type UrlValidationResult =
  | {
      ok: true
      kind: UrlKind
      url: URL
      normalized: string
      sourceProductId: string | null
    }
  | { ok: false; code: TechnolifeImportErrorCode; message: string }

export function extractTechnolifeProductId(pathname: string): string | null {
  const m = pathname.match(/\/product-(\d+)(?:\/|$)/i)
  return m?.[1] || null
}

export function extractTechnolifeCategoryPath(pathname: string): string | null {
  const cleaned = pathname.replace(/\/+$/, '') || '/'
  if (!/^\/category\//i.test(cleaned)) return null
  return cleaned.replace(/^\//, '')
}

function parseAllowedTechnolifeUrl(input: string): UrlValidationResult | { ok: true; url: URL } {
  const raw = String(input || '').trim()
  if (!raw) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'آدرس خالی است' }
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'آدرس نامعتبر است' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, code: 'SSRF_BLOCKED', message: 'فقط http/https مجاز است' }
  }

  const host = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    return { ok: false, code: 'SSRF_BLOCKED', message: 'هدف داخلی مجاز نیست' }
  }
  if (host.includes(':') || isPrivateIpv4(host)) {
    return { ok: false, code: 'SSRF_BLOCKED', message: 'آی‌پی خصوصی مجاز نیست' }
  }

  if (!technolifeConfig.allowedHosts.has(host)) {
    return {
      ok: false,
      code: 'SSRF_BLOCKED',
      message: 'فقط دامنه technolife مجاز است',
    }
  }

  return { ok: true, url: parsed }
}

/**
 * Product page validator (used by product fetch / batch items).
 */
export function validateTechnolifeUrl(input: string): UrlValidationResult {
  const base = parseAllowedTechnolifeUrl(input)
  if (!base.ok) return base

  const sourceProductId = extractTechnolifeProductId(base.url.pathname)
  if (!sourceProductId) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'آدرس باید صفحه محصول technolife باشد (product-{id})',
    }
  }

  base.url.hash = ''
  const normalized = `${base.url.origin}${base.url.pathname}`.replace(/\/+$/, '')

  return {
    ok: true,
    kind: 'product',
    url: base.url,
    normalized,
    sourceProductId,
  }
}

/**
 * Category listing validator — keeps filter query string (manufacturer_id, af, …).
 */
export function validateTechnolifeCategoryUrl(input: string): UrlValidationResult {
  const base = parseAllowedTechnolifeUrl(input)
  if (!base.ok) return base

  const categoryPath = extractTechnolifeCategoryPath(base.url.pathname)
  if (!categoryPath) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'آدرس باید صفحه دسته‌بندی technolife باشد (/category/...)',
    }
  }

  base.url.hash = ''
  const search = base.url.search || ''
  const normalized = `${base.url.origin}/${categoryPath}${search}`

  return {
    ok: true,
    kind: 'category',
    url: base.url,
    normalized,
    sourceProductId: null,
  }
}

/**
 * Accept either a product or category Technolife URL.
 */
export function validateTechnolifeInputUrl(input: string): UrlValidationResult {
  const base = parseAllowedTechnolifeUrl(input)
  if (!base.ok) return base

  if (extractTechnolifeProductId(base.url.pathname)) {
    return validateTechnolifeUrl(input)
  }
  if (extractTechnolifeCategoryPath(base.url.pathname)) {
    return validateTechnolifeCategoryUrl(input)
  }

  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    message: 'آدرس باید صفحه محصول (product-{id}) یا دسته (/category/...) باشد',
  }
}

export function buildTechnolifeProductUrl(origin: string, productId: string): string {
  const base = origin.replace(/\/+$/, '')
  return `${base}/product-${productId}`
}

export function normalizeImageUrl(src: string, pageUrl: string): string | null {
  const s = String(src || '').trim()
  if (!s || s.startsWith('data:')) return null
  try {
    const u = new URL(s, pageUrl)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    const host = u.hostname.toLowerCase()
    if (BLOCKED_HOSTS.has(host) || isPrivateIpv4(host)) return null
    return u.toString()
  } catch {
    return null
  }
}
