import { normalizePersianText } from '#services/technolife/persian'
import { normalizeToToman } from '#services/technolife/price'
import technolifeConfig from '#config/technolife'
import type {
  TechnolifeNormalizedProduct,
  TechnolifeParsedProduct,
} from '#services/technolife/types'

function sanitizeProductHtml(input: string | null): string | null {
  if (!input) return null
  let s = String(input)
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi, '')
  s = s.replace(/<a\b[^>]*>/gi, '').replace(/<\/a>/gi, '')
  s = s.replace(/<h1\b[^>]*>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>')

  const allowed = new Set([
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'strong',
    'b',
    'em',
    'i',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'img',
  ])
  s = s.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, rawName: string) => {
    const name = rawName.toLowerCase()
    if (!allowed.has(name)) return ''
    if (tag.startsWith('</')) return name === 'br' || name === 'img' ? '' : `</${name}>`
    if (name === 'br') return '<br>'
    if (name !== 'img') return `<${name}>`

    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]?.trim() || ''
    if (!/^(?:https?:\/\/|\/)/i.test(src) || /^javascript:/i.test(src)) return ''
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] || ''
    return `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" loading="lazy">`
  })

  s = s
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : normalizePersianText(part)))
    .join('')
    .replace(/(?:<br>){3,}/g, '<br><br>')
    .trim()
  return s || null
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function slugifyProductTitle(input: string): string {
  return normalizePersianText(input)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
    .replace(/-+$/g, '')
}

function storageLabel(parsed: TechnolifeParsedProduct): string | null {
  const spec = parsed.specs.find((item) => /حافظه داخلی|storage/i.test(item.key))
  if (!spec?.value) return null
  const match = normalizePersianText(spec.value).match(
    /(\d+(?:\.\d+)?)\s*(گیگابایت|ترابایت|GB|TB)/i
  )
  if (!match) return null
  const unit = /ترابایت|TB/i.test(match[2] || '') ? 'TB' : 'GB'
  return `${match[1]}${unit}`
}

function makeShortName(parsed: TechnolifeParsedProduct, title: string): string | null {
  const storage = storageLabel(parsed)
  let result = parsed.model
    ? normalizePersianText(parsed.model)
    : title
        .replace(/^(?:گوشی\s*)?(?:موبایل|موبايل)\s*/i, '')
        .replace(/\s*(?:ظرفیت|حافظه)\b[\s\S]*$/i, '')
        .replace(/\s*-\s*(?:not\s*active|رجیستر)[\s\S]*$/i, '')
        .trim()
  const storageNumber = storage?.match(/^\d+(?:\.\d+)?/)?.[0]
  const alreadyHasStorage = Boolean(
    storage &&
    (result.toLowerCase().includes(storage.toLowerCase()) ||
      (storageNumber && result.includes(storageNumber) && /(?:GB|TB|گیگ|ترابایت)/i.test(result)))
  )
  if (storage && !alreadyHasStorage) result += ` ${storage}`
  result = normalizePersianText(result)
  if (!result) return null
  if (result.length <= 60) return result
  return result
    .slice(0, 60)
    .replace(/\s+\S*$/, '')
    .trim()
}

export function normalizeTechnolifeProduct(
  parsed: TechnolifeParsedProduct
): TechnolifeNormalizedProduct {
  const title = normalizePersianText(parsed.name || '')
  const brandName =
    normalizePersianText(parsed.brandFa || parsed.brandEn || parsed.brandRaw || '') || 'متفرقه'

  const priceToman = normalizeToToman(parsed.priceAmount, parsed.priceCurrency || 'IRT')
  const oldPriceToman = normalizeToToman(parsed.oldPriceAmount, parsed.priceCurrency || 'IRT')

  let discountPercent = parsed.discountPercent
  if (
    discountPercent === null &&
    oldPriceToman !== null &&
    priceToman !== null &&
    oldPriceToman > priceToman
  ) {
    discountPercent = Math.round(((oldPriceToman - priceToman) / oldPriceToman) * 100)
  }

  const suggestedProductId = slugifyProductTitle(title) || null

  const specs = parsed.specs
    .map((s) => ({
      key: normalizePersianText(s.key),
      value: normalizePersianText(s.value),
    }))
    .filter((s) => s.key && s.value)

  return {
    source: 'technolife',
    sourceUrl: parsed.sourceUrl,
    sourceProductId: parsed.sourceProductId,
    title,
    shortName: title ? makeShortName(parsed, title) : null,
    brandName,
    model: parsed.model ? normalizePersianText(parsed.model) : null,
    description: sanitizeProductHtml(parsed.reviewHtml || parsed.description),
    shortDesc: parsed.shortDescription
      ? normalizePersianText(parsed.shortDescription).slice(0, 280)
      : null,
    priceToman,
    oldPriceToman:
      oldPriceToman !== null && priceToman !== null && oldPriceToman > priceToman
        ? oldPriceToman
        : null,
    discountPercent,
    availability: parsed.availability,
    availabilityText: parsed.availabilityText,
    stock:
      parsed.availability === 'out_of_stock' ? 0 : (parsed.stock ?? technolifeConfig.defaultStock),
    images: parsed.images,
    reviewImages: parsed.reviewImages,
    colors: parsed.colors,
    specs,
    variants: parsed.variants.map((v) => ({
      axis: v.axis,
      label: normalizePersianText(v.label),
      value: v.value ? normalizePersianText(v.value) : undefined,
    })),
    categoryHints: parsed.categoryPath.map((c) => normalizePersianText(c)).filter(Boolean),
    sku: parsed.sku,
    suggestedProductId,
  }
}
