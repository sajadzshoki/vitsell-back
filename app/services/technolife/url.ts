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

export type UrlValidationResult =
  | { ok: true; url: URL; normalized: string; sourceProductId: string | null }
  | { ok: false; code: TechnolifeImportErrorCode; message: string }

export function extractTechnolifeProductId(pathname: string): string | null {
  const m = pathname.match(/\/product-(\d+)(?:\/|$)/i)
  return m?.[1] || null
}

export function validateTechnolifeUrl(input: string): UrlValidationResult {
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
  if (isPrivateIpv4(host) || host.includes(':')) {
    // Block literal IPv6 and private IPv4
    if (host.includes(':') || isPrivateIpv4(host)) {
      return { ok: false, code: 'SSRF_BLOCKED', message: 'آی‌پی خصوصی مجاز نیست' }
    }
  }

  if (!technolifeConfig.allowedHosts.has(host)) {
    return {
      ok: false,
      code: 'SSRF_BLOCKED',
      message: 'فقط دامنه technolife مجاز است',
    }
  }

  const sourceProductId = extractTechnolifeProductId(parsed.pathname)
  if (!sourceProductId) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'آدرس باید صفحه محصول technolife باشد (product-{id})',
    }
  }

  parsed.hash = ''
  // Drop tracking params but keep path
  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '')

  return {
    ok: true,
    url: parsed,
    normalized,
    sourceProductId,
  }
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
