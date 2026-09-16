import Brand from '#models/brand'
import { normalizeBrandKey, normalizePersianText } from '#services/technolife/persian'

const BRAND_ALIASES: Record<string, string[]> = {
  سامسونگ: ['samsung', 'سامسونگ'],
  اپل: ['apple', 'اپل', 'آیفون'],
  شیائومی: ['xiaomi', 'شیائومی', 'شیاومی'],
  هوآوی: ['huawei', 'هوآوی', 'هواوی'],
  آنر: ['honor', 'آنر', 'انر'],
  نوکیا: ['nokia', 'نوکیا'],
  گوگل: ['google', 'گوگل', 'pixel'],
  ناتینگ: ['nothing', 'ناتینگ'],
  وان‌پلاس: ['oneplus', 'وان پلاس', 'وان‌پلاس'],
  ریلمی: ['realme', 'ریلمی'],
  اوپو: ['oppo', 'اوپو'],
  ویوو: ['vivo', 'ویوو'],
  موتورولا: ['motorola', 'موتورولا'],
}

function canonicalBrandName(name: string): string {
  const key = normalizeBrandKey(name)
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some((a) => normalizeBrandKey(a) === key || key.includes(normalizeBrandKey(a)))) {
      return canonical
    }
  }
  return normalizePersianText(name) || name
}

function slugifyBrand(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ascii)) return ascii
  // Fallback for Persian-only names
  const map: Record<string, string> = {
    سامسونگ: 'samsung',
    اپل: 'apple',
    شیائومی: 'xiaomi',
    هوآوی: 'huawei',
    آنر: 'honor',
    نوکیا: 'nokia',
    گوگل: 'google',
    ناتینگ: 'nothing',
    ریلمی: 'realme',
    اوپو: 'oppo',
    ویوو: 'vivo',
    موتورولا: 'motorola',
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

  const brands = await Brand.query().limit(500)
  for (const b of brands) {
    const n = normalizeBrandKey(b.name)
    if (n === key) {
      return { id: b.id, name: display, created: false }
    }
    for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
      const aliasHit =
        aliases.some((a) => normalizeBrandKey(a) === key) &&
        aliases.some((a) => normalizeBrandKey(a) === n)
      if (aliasHit) {
        return { id: b.id, name: canonical, created: false }
      }
    }
    if (n.includes(key) || key.includes(n)) {
      return { id: b.id, name: display, created: false }
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
