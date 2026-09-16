import { toAsciiDigits } from '#services/technolife/persian'

/**
 * Technolife JSON-LD uses IRR (ریال).
 * Vitsell catalog stores integer تومان.
 * Conversion: toman = round(rial / 10). Never invent other FX rates.
 */
export function rialToToman(rial: number): number {
  if (!Number.isFinite(rial) || rial < 0) {
    throw new Error('Invalid rial amount')
  }
  return Math.round(rial / 10)
}

export function parsePriceNumber(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null
  }
  const cleaned = toAsciiDigits(String(raw))
    .replace(/[^\d.]/g, '')
    .trim()
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Normalize a scraped price into integer تومان.
 * - If currency is IRR / ریال / RIAL → ÷10
 * - If currency is IRT / تومان / TOMAN → keep as integer
 * - If currency unknown but value looks like rial (>= 100_000 and divisible sense) —
 *   require explicit currency; otherwise treat as toman only when labeled, else null.
 */
export function normalizeToToman(
  amount: number | null,
  currency: string | null | undefined
): number | null {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null
  const c = String(currency || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  if (!c) {
    // Prefer explicit currency. Technolife Product offers use IRR.
    return null
  }

  if (c === 'IRR' || c === 'RIAL' || c.includes('ریال') || c === 'RLS') {
    return rialToToman(amount)
  }

  if (c === 'IRT' || c === 'TOMAN' || c.includes('تومان') || c === 'TMN') {
    return Math.round(amount)
  }

  return null
}

export function parsePersianPriceToToman(
  text: string | null | undefined,
  explicitCurrency?: string | null
): number | null {
  if (!text) return null
  const amount = parsePriceNumber(text)
  if (amount == null) return null
  const lower = String(text)
  let currency = explicitCurrency || null
  if (!currency) {
    if (/ریال|rial|irr/i.test(lower)) currency = 'IRR'
    else if (/تومان|toman|irt/i.test(lower)) currency = 'IRT'
  }
  return normalizeToToman(amount, currency)
}
