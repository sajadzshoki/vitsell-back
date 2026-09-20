import { normalizeBrandKey, normalizePersianText } from '#services/technolife/persian'

const BRAND_STRIP: string[] = [
  'samsung',
  'سامسونگ',
  'apple',
  'اپل',
  'آیفون',
  'xiaomi',
  'شیائومی',
  'شیاومی',
  'poco',
  'پوکو',
  'huawei',
  'هوآوی',
  'هواوی',
  'honor',
  'آنر',
  'nokia',
  'نوکیا',
  'google',
  'گوگل',
  'nothing',
  'ناتینگ',
  'realme',
  'ریلمی',
  'oppo',
  'اوپو',
  'vivo',
  'ویوو',
  'motorola',
  'موتورولا',
  'asus',
  'ایسوس',
  'lenovo',
  'لنوو',
]

/**
 * Coarse product-line for tags / filters — NOT a category leaf.
 * Examples: iPhone Pro Max, Galaxy A, Redmi Note, Poco
 */
export function extractProductLine(input: {
  brandName: string
  model: string | null
  title: string
}): string | null {
  const hay = normalizePersianText([input.model, input.title].filter(Boolean).join(' '))
  if (!hay) return null

  const rules: Array<{ match: RegExp; line: string }> = [
    { match: /iphone(?:\s*\d+)?\s*pro\s*max|آیفون(?:\s*\d+)?\s*پرو\s*مکس/i, line: 'iPhone Pro Max' },
    { match: /iphone(?:\s*\d+)?\s*pro(?!\s*max)|آیفون(?:\s*\d+)?\s*پرو(?!\s*مکس)/i, line: 'iPhone Pro' },
    { match: /iphone(?:\s*\d+)?\s*air|آیفون(?:\s*\d+)?\s*ایر/i, line: 'iPhone Air' },
    { match: /iphone\s*se|آیفون\s*se/i, line: 'iPhone SE' },
    { match: /iphone|آیفون/i, line: 'iPhone' },
    { match: /ipad\s*pro/i, line: 'iPad Pro' },
    { match: /ipad\s*air/i, line: 'iPad Air' },
    { match: /ipad\s*mini/i, line: 'iPad mini' },
    { match: /ipad/i, line: 'iPad' },
    { match: /macbook\s*pro/i, line: 'MacBook Pro' },
    { match: /macbook\s*air/i, line: 'MacBook Air' },
    { match: /macbook/i, line: 'MacBook' },
    { match: /galaxy\s*z\s*fold/i, line: 'Galaxy Z Fold' },
    { match: /galaxy\s*z\s*flip/i, line: 'Galaxy Z Flip' },
    { match: /galaxy\s*s\d/i, line: 'Galaxy S' },
    { match: /galaxy\s*a\d/i, line: 'Galaxy A' },
    { match: /galaxy\s*m\d/i, line: 'Galaxy M' },
    { match: /galaxy\s*f\d/i, line: 'Galaxy F' },
    { match: /redmi\s*note|ردمی\s*نوت/i, line: 'Redmi Note' },
    { match: /redmi\s*turbo/i, line: 'Redmi Turbo' },
    { match: /\bredmi\b|ردمی/i, line: 'Redmi' },
    { match: /\bpoco\b|پوکو/i, line: 'Poco' },
    { match: /pixel\s*pro/i, line: 'Pixel Pro' },
    { match: /\bpixel\b/i, line: 'Pixel' },
    { match: /nothing\s*phone/i, line: 'Nothing Phone' },
  ]

  for (const rule of rules) {
    if (rule.match.test(hay)) return rule.line
  }

  // Fallback: first 1–2 tokens of cleaned model (no capacity / RAM)
  let raw = normalizePersianText(input.model || '')
  if (!raw) {
    raw = normalizePersianText(input.title || '')
      .replace(/^(?:گوشی\s*)?(?:موبایل|موبايل)\s*/i, '')
      .trim()
  }
  if (!raw) return null

  const brandKey = normalizeBrandKey(input.brandName)
  for (const token of [...BRAND_STRIP, brandKey].filter(Boolean)) {
    const re = new RegExp(`(^|\\s)${escapeRegExp(token)}(?=\\s|$)`, 'gi')
    raw = raw.replace(re, ' ').trim()
  }

  raw = normalizePersianText(raw)
    .replace(/^(?:مدل|model)\s+/i, '')
    .replace(/\b\d+\s*(?:\/\s*\d+\s*)?(?:GB|TB|گیگابایت|ترابایت|گیگ)\b/gi, ' ')
    .replace(/\b(?:RAM|رم)\b[\s\S]*$/i, ' ')
    .replace(/\b(?:dual\s*sim|دو\s*سیم[^\s]*)\b/gi, ' ')
    .replace(/\b(?:4G|5G|LTE)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!raw) return null
  const tokens = raw.split(/\s+/).filter(Boolean).slice(0, 2)
  const line = tokens.join(' ')
  return line.length >= 2 ? line : null
}

/** @deprecated use extractProductLine — kept for older imports/tests */
export function extractSeriesLabel(input: {
  brandName: string
  model: string | null
  title: string
}): string | null {
  return extractProductLine(input)
}

/** Prefer ASCII slug; fall back to stable compact id for Persian-only labels. */
export function slugifyTaxonomyPart(input: string): string {
  const ascii = normalizePersianText(input)
    .toLowerCase()
    .replace(/pro\s*max/gi, 'pro-max')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 48)

  if (ascii.length >= 2) return ascii

  const compact = normalizePersianText(input)
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .slice(0, 40)
  if (compact.length >= 2) return compact.toLowerCase()

  let hash = 0
  for (const ch of input) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return `s-${hash.toString(36)}`
}

export function extractStorageLabel(specs: Array<{ key: string; value: string }>, title?: string) {
  const fromSpec = specs.find((s) => /حافظه داخلی|storage|ظرفیت/i.test(s.key))
  const hay = normalizePersianText(fromSpec?.value || title || '')
  const match = hay.match(/(\d+(?:\.\d+)?)\s*(گیگابایت|ترابایت|GB|TB)/i)
  if (!match) return null
  const amount = match[1]
  const unit = /ترابایت|TB/i.test(match[2] || '') ? 'TB' : 'GB'
  const faUnit = unit === 'TB' ? 'ترابایت' : 'گیگابایت'
  return {
    label: `${toPersianDigits(amount)} ${faUnit}`,
    value: `${amount}${unit}`.toLowerCase(),
    idHint: `st-${amount}${unit}`.toLowerCase(),
  }
}

function toPersianDigits(input: string) {
  const map = '۰۱۲۳۴۵۶۷۸۹'
  return String(input).replace(/\d/g, (d) => map[Number(d)] || d)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
