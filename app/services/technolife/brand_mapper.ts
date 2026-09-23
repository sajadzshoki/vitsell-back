import Brand from '#models/brand'
import { normalizeBrandKey, normalizePersianText } from '#services/technolife/persian'

export const BRAND_ALIASES: Record<string, string[]> = {
  سامسونگ: ['samsung', 'سامسونگ', 'Samsung'],
  // Product lines (آیفون/iphone) stay in catalog search synonyms — not brand aliases,
  // otherwise q=ایفون matches every Apple SKU (MacBook, AirPods, …).
  اپل: ['apple', 'اپل', 'Apple'],
  شیائومی: ['xiaomi', 'شیائومی', 'شیاومی', 'Xiaomi'],
  پوکو: ['poco', 'پوکو', 'Poco'],
  هوآوی: ['huawei', 'هوآوی', 'هواوی', 'Huawei'],
  آنر: ['honor', 'آنر', 'انر', 'Honor'],
  نوکیا: ['nokia', 'نوکیا', 'Nokia'],
  گوگل: ['google', 'گوگل', 'pixel', 'Google', 'Pixel'],
  ناتینگ: ['nothing', 'ناتینگ', 'Nothing'],
  وان‌پلاس: ['oneplus', 'وان پلاس', 'وان‌پلاس', 'OnePlus'],
  ریلمی: ['realme', 'ریلمی', 'Realme'],
  اوپو: ['oppo', 'اوپو', 'Oppo'],
  ویوو: ['vivo', 'ویوو', 'Vivo'],
  موتورولا: ['motorola', 'موتورولا', 'Motorola'],
  ایسوس: ['asus', 'ایسوس', 'ASUS', 'Asus'],
  لنوو: ['lenovo', 'لنوو', 'Lenovo'],
  اچ‌پی: ['hp', 'اچ پی', 'اچ‌پی', 'HP'],
  دل: ['dell', 'دل', 'Dell'],
  سونی: ['sony', 'سونی', 'Sony'],
  ال‌جی: ['lg', 'ال جی', 'ال‌جی', 'LG'],
  جی‌بی‌ال: ['jbl', 'جی بی ال', 'جی‌بی‌ال', 'JBL'],
}

/** All display/name variants for a brand filter or search token (FA + EN). */
export function expandBrandNameAliases(name: string): string[] {
  const raw = String(name || '').trim()
  if (!raw) return []
  const key = normalizeBrandKey(raw)
  const out = new Set<string>([raw])
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    const hit =
      normalizeBrandKey(canonical) === key ||
      aliases.some((a) => normalizeBrandKey(a) === key)
    if (!hit) continue
    out.add(canonical)
    for (const a of aliases) out.add(a)
  }
  return [...out]
}

/** Exact alias hit only — never substring (avoids empty/short keys mapping to Apple). */
function aliasCanonical(key: string): string | null {
  if (!key) return null
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some((a) => normalizeBrandKey(a) === key)) {
      return canonical
    }
  }
  return null
}

function canonicalBrandName(name: string): string {
  const key = normalizeBrandKey(name)
  return aliasCanonical(key) || normalizePersianText(name) || name
}

function slugifyBrand(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ascii)) return ascii
  const map: Record<string, string> = {
    سامسونگ: 'samsung',
    اپل: 'apple',
    شیائومی: 'xiaomi',
    پوکو: 'poco',
    هوآوی: 'huawei',
    آنر: 'honor',
    نوکیا: 'nokia',
    گوگل: 'google',
    ناتینگ: 'nothing',
    ریلمی: 'realme',
    اوپو: 'oppo',
    ویوو: 'vivo',
    موتورولا: 'motorola',
    ایسوس: 'asus',
    لنوو: 'lenovo',
    اچ‌پی: 'hp',
    دل: 'dell',
    سونی: 'sony',
    ال‌جی: 'lg',
    جی‌بی‌ال: 'jbl',
    متفرقه: 'other',
  }
  return map[name] || `brand-${Date.now().toString(36)}`
}

export type ResolvedBrand = {
  id: string
  name: string
  created: boolean
}

export async function resolveBrand(
  rawName: string,
  opts?: { createIfMissing?: boolean }
): Promise<ResolvedBrand> {
  const createIfMissing = opts?.createIfMissing !== false
  const display = canonicalBrandName(rawName || 'متفرقه')
  const key = normalizeBrandKey(display)
  if (!key) {
    return { id: '', name: 'متفرقه', created: false }
  }

  const brands = await Brand.query().orderBy('sort_order', 'asc').limit(500)
  for (const b of brands) {
    const n = normalizeBrandKey(b.name)
    if (!n) continue
    if (n === key) {
      return { id: b.id, name: b.name, created: false }
    }
    const keyCanonical = aliasCanonical(key)
    const brandCanonical = aliasCanonical(n)
    if (keyCanonical && brandCanonical && keyCanonical === brandCanonical) {
      // Keep brands.name aligned with product.brand (Persian canonical), otherwise
      // seller brand selects (English seed names) look empty for imported products.
      if (b.name !== keyCanonical) {
        b.name = keyCanonical
        await b.save()
      }
      return { id: b.id, name: keyCanonical, created: false }
    }
  }

  if (!createIfMissing) {
    return { id: '', name: display, created: false }
  }

  const slug = slugifyBrand(display)
  const id = `brand-${slug}`
  const existing = await Brand.find(id)
  if (existing) {
    return { id: existing.id, name: existing.name, created: false }
  }

  const bySlug = await Brand.query().where('slug', slug).first()
  if (bySlug) {
    return { id: bySlug.id, name: bySlug.name, created: false }
  }

  const created = await Brand.create({
    id,
    name: display,
    slug,
    logo: null,
    description: '',
    status: 'active',
    sortOrder: 0,
    seo: null,
  })

  return { id: created.id, name: created.name, created: true }
}
