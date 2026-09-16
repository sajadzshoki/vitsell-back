import { normalizePersianText } from '#services/technolife/persian'
import { normalizeToToman } from '#services/technolife/price'
import type {
  TechnolifeNormalizedProduct,
  TechnolifeParsedProduct,
} from '#services/technolife/types'

function sanitizeProductHtml(input: string | null): string | null {
  if (!input) return null
  let s = String(input)
  // Drop scripts/styles/iframes entirely
  s = s.replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/on\w+=["'][^"']*["']/gi, '')
  s = s.replace(/javascript:/gi, '')
  // Allow a small set of tags; strip others keeping text
  s = s.replace(/<\/?(?!p|br|ul|ol|li|strong|b|em|i|h[1-4]\b)([a-z0-9]+)[^>]*>/gi, ' ')
  s = normalizePersianText(s.replace(/\s+/g, ' '))
  return s || null
}

export function normalizeTechnolifeProduct(
  parsed: TechnolifeParsedProduct
): TechnolifeNormalizedProduct {
  const title = normalizePersianText(parsed.name || '')
  const brandName =
    normalizePersianText(parsed.brandFa || parsed.brandEn || parsed.brandRaw || '') || 'متفرقه'

  const priceToman = normalizeToToman(parsed.priceRial, parsed.priceCurrency || 'IRR')
  const oldPriceToman = normalizeToToman(parsed.oldPriceRial, parsed.priceCurrency || 'IRR')

  let discountPercent = parsed.discountPercent
  if (
    discountPercent == null &&
    oldPriceToman != null &&
    priceToman != null &&
    oldPriceToman > priceToman
  ) {
    discountPercent = Math.round(((oldPriceToman - priceToman) / oldPriceToman) * 100)
  }

  const suggestedProductId = parsed.sourceProductId
    ? `tl-${parsed.sourceProductId}`
    : null

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
    shortName: title ? title.slice(0, 80) : null,
    brandName,
    model: parsed.model ? normalizePersianText(parsed.model) : null,
    description: sanitizeProductHtml(parsed.description),
    shortDesc: parsed.shortDescription
      ? normalizePersianText(parsed.shortDescription).slice(0, 280)
      : null,
    priceToman,
    oldPriceToman:
      oldPriceToman != null && priceToman != null && oldPriceToman > priceToman
        ? oldPriceToman
        : null,
    discountPercent,
    availability: parsed.availability,
    availabilityText: parsed.availabilityText,
    images: parsed.images,
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
