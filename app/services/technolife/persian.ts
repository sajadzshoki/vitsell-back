/** Persian / Arabic text and digit normalization for Technolife payloads. */

const ARABIC_YEH = /\u064A/g // ي
const FARSI_YEH = '\u06CC' // ی
const ARABIC_KEH = /\u0643/g // ك
const FARSI_KEH = '\u06A9' // ک
/** آ أ إ ٱ → ا so search typos like ایفون match آیفون */
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g
const PLAIN_ALEF = '\u0627'
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u00AD]/g
const MULTI_SPACE = /\s+/g

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function toAsciiDigits(input: string): string {
  let out = ''
  for (const ch of input) {
    const p = PERSIAN_DIGITS.indexOf(ch)
    if (p >= 0) {
      out += String(p)
      continue
    }
    const a = ARABIC_DIGITS.indexOf(ch)
    if (a >= 0) {
      out += String(a)
      continue
    }
    out += ch
  }
  return out
}

export function normalizePersianText(input: string | null | undefined): string {
  if (input == null) return ''
  let s = String(input)
  s = s.replace(ZERO_WIDTH, '')
  s = s.replace(ARABIC_YEH, FARSI_YEH).replace(ARABIC_KEH, FARSI_KEH)
  s = s.replace(ALEF_VARIANTS, PLAIN_ALEF)
  s = toAsciiDigits(s)
  s = decodeBasicHtmlEntities(s)
  s = s.replace(MULTI_SPACE, ' ').trim()
  return s
}

export function normalizeBrandKey(input: string): string {
  return normalizePersianText(input)
    .toLowerCase()
    .replace(/[|\/\\]+/g, ' ')
    .replace(MULTI_SPACE, ' ')
    .trim()
}

/** Split Technolife brand fields like "اپل|Apple" */
export function splitTechnolifeBrand(raw: string | null | undefined): {
  fa: string | null
  en: string | null
  display: string
} {
  const cleaned = normalizePersianText(raw)
  if (!cleaned) return { fa: null, en: null, display: '' }
  const parts = cleaned.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const fa = parts[0] || null
    const en = parts[1] || null
    return { fa, en, display: fa || en || cleaned }
  }
  return { fa: cleaned, en: null, display: cleaned }
}

export function decodeBasicHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&zwnj;/gi, '')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCharCode(code) : _
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = Number.parseInt(h, 16)
      return Number.isFinite(code) ? String.fromCharCode(code) : _
    })
}

export function stripTags(html: string): string {
  return normalizePersianText(html.replace(/<[^>]+>/g, ' '))
}
