import {
  normalizePersianText,
  splitTechnolifeBrand,
  stripTags,
} from '#services/technolife/persian'
import { parsePriceNumber } from '#services/technolife/price'
import { extractTechnolifeProductId, normalizeImageUrl } from '#services/technolife/url'
import type {
  TechnolifeAvailability,
  TechnolifeParsedProduct,
  TechnolifeSpec,
  TechnolifeVariantOption,
} from '#services/technolife/types'

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const raw = m[1]?.trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) blocks.push(...parsed)
      else blocks.push(parsed)
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return blocks
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function findProductNode(nodes: unknown[]): Record<string, unknown> | null {
  for (const node of nodes) {
    const obj = asRecord(node)
    if (!obj) continue
    const type = obj['@type']
    const types = Array.isArray(type) ? type.map(String) : [String(type || '')]
    if (types.some((t) => t.toLowerCase() === 'product')) return obj
    if (Array.isArray(obj['@graph'])) {
      const nested = findProductNode(obj['@graph'] as unknown[])
      if (nested) return nested
    }
  }
  return null
}

function findBreadcrumbPath(nodes: unknown[]): string[] {
  for (const node of nodes) {
    const obj = asRecord(node)
    if (!obj) continue
    const type = String(obj['@type'] || '')
    if (type.toLowerCase() !== 'breadcrumblist') continue
    const elements = Array.isArray(obj.itemListElement) ? obj.itemListElement : []
    const names: string[] = []
    for (const el of elements) {
      const item = asRecord(el)
      if (!item) continue
      const nested = asRecord(item.item) || item
      const name = normalizePersianText(String(nested.name || ''))
      if (name) names.push(name)
    }
    return names
  }
  return []
}

function parseAvailability(raw: unknown): TechnolifeAvailability {
  const s = String(raw || '').toLowerCase()
  if (!s) return 'unknown'
  if (s.includes('outofstock') || s.includes('soldout') || s.includes('ناموجود')) {
    return 'out_of_stock'
  }
  if (s.includes('instock') || s.includes('instock') || s.includes('موجود')) {
    return 'in_stock'
  }
  if (s.includes('https://schema.org/instock')) return 'in_stock'
  if (s.includes('https://schema.org/outofstock')) return 'out_of_stock'
  return 'unknown'
}

function collectOffer(product: Record<string, unknown>): {
  priceRial: number | null
  oldPriceRial: number | null
  currency: string | null
  availability: TechnolifeAvailability
  availabilityText: string | null
} {
  const offers = product.offers
  const offerObj = Array.isArray(offers) ? asRecord(offers[0]) : asRecord(offers)
  if (!offerObj) {
    return {
      priceRial: null,
      oldPriceRial: null,
      currency: null,
      availability: 'unknown',
      availabilityText: null,
    }
  }

  const currency = String(offerObj.priceCurrency || 'IRR')
  let priceRial = parsePriceNumber(offerObj.lowPrice as never) ?? parsePriceNumber(offerObj.price as never)
  const high = parsePriceNumber(offerObj.highPrice as never)

  let nestedAvailability: TechnolifeAvailability = 'unknown'
  let availabilityText: string | null = null

  const nestedOffers = Array.isArray(offerObj.offers) ? offerObj.offers : []
  if (nestedOffers.length) {
    const first = asRecord(nestedOffers[0])
    if (first) {
      priceRial = parsePriceNumber(first.price as never) ?? priceRial
      nestedAvailability = parseAvailability(first.availability)
      availabilityText = first.availability ? String(first.availability) : null
    }
  } else {
    nestedAvailability = parseAvailability(offerObj.availability)
    availabilityText = offerObj.availability ? String(offerObj.availability) : null
  }

  const oldPriceRial =
    high != null && priceRial != null && high > priceRial ? high : null

  return {
    priceRial,
    oldPriceRial,
    currency,
    availability: nestedAvailability,
    availabilityText,
  }
}

function extractImages(product: Record<string, unknown>, pageUrl: string): string[] {
  const raw = product.image
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const out: string[] = []
  for (const item of list) {
    const src = typeof item === 'string' ? item : String(asRecord(item)?.url || '')
    const abs = normalizeImageUrl(src, pageUrl)
    if (abs && !out.includes(abs)) out.push(abs)
  }
  return out
}

function extractSpecsFromHtml(html: string): TechnolifeSpec[] {
  const specs: TechnolifeSpec[] = []
  // Prefer rows inside tables near specification headings
  const tableChunks = html.match(/<table[\s\S]*?<\/table>/gi) || []
  const sources = tableChunks.length ? tableChunks : [html]
  const rowRe =
    /<tr[^>]*>\s*<t[hd][^>]*>([\s\S]*?)<\/t[hd]>\s*<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi
  const blocked = /ورود|ثبت نام|سبد خرید|جستجو|منو|footer|header|login|cart/i

  for (const chunk of sources) {
    let m: RegExpExecArray | null
    const localRe = new RegExp(rowRe.source, 'gi')
    while ((m = localRe.exec(chunk)) !== null) {
      const key = stripTags(m[1] || '')
      const value = stripTags(m[2] || '')
      if (!key || !value) continue
      if (key.length < 2 || key.length > 60 || value.length > 200) continue
      if (blocked.test(key) || blocked.test(value)) continue
      if (specs.some((s) => s.key === key && s.value === value)) continue
      specs.push({ key, value })
      if (specs.length >= 60) return specs
    }
  }
  return specs
}

function extractVariantsFromHtml(html: string): TechnolifeVariantOption[] {
  const variants: TechnolifeVariantOption[] = []
  const colorRe = /رنگ\s*[:：]\s*([^<\n]{1,40})/gi
  let m: RegExpExecArray | null
  while ((m = colorRe.exec(html)) !== null) {
    const label = normalizePersianText(m[1])
    if (label) variants.push({ axis: 'color', label })
  }
  const storageRe = /(?:حافظه|ظرفیت)\s*(?:داخلی)?\s*[:：]?\s*(\d+\s*(?:GB|گیگ|TB|ترابایت)?)/gi
  while ((m = storageRe.exec(html)) !== null) {
    const label = normalizePersianText(m[1])
    if (label) variants.push({ axis: 'storage', label })
  }
  const ramRe = /رم\s*[:：]?\s*(\d+\s*(?:GB|گیگ)?)/gi
  while ((m = ramRe.exec(html)) !== null) {
    const label = normalizePersianText(m[1])
    if (label) variants.push({ axis: 'ram', label })
  }
  return variants
}

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  )
  const m = html.match(re)
  return m?.[1] ? normalizePersianText(decodeURIComponent(m[1].replace(/\+/g, ' '))) : null
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m?.[1] ? stripTags(m[1]) : null
}

/**
 * Prefer JSON-LD Product, then meta/HTML fallbacks.
 */
export function parseTechnolifeHtml(html: string, pageUrl: string): TechnolifeParsedProduct {
  const jsonLd = extractJsonLdBlocks(html)
  const product = findProductNode(jsonLd)
  const categoryPath = findBreadcrumbPath(jsonLd)
  const offer = product
    ? collectOffer(product)
    : {
        priceRial: null,
        oldPriceRial: null,
        currency: null,
        availability: 'unknown' as const,
        availabilityText: null,
      }

  const brandRaw = product
    ? String(asRecord(product.brand)?.name || product.brand || '')
    : ''
  const brandParts = splitTechnolifeBrand(brandRaw)

  const nameFromLd = product ? normalizePersianText(String(product.name || '')) : ''
  const name =
    nameFromLd ||
    metaContent(html, 'og:title') ||
    titleTag(html) ||
    null

  const descriptionRaw = product
    ? String(product.description || '')
    : metaContent(html, 'og:description') || ''
  const description = descriptionRaw ? normalizePersianText(descriptionRaw) : null

  const images = product
    ? extractImages(product, pageUrl)
    : (() => {
        const og = metaContent(html, 'og:image')
        const abs = og ? normalizeImageUrl(og, pageUrl) : null
        return abs ? [abs] : []
      })()

  const sku = product ? normalizePersianText(String(product.sku || product.mpn || '')) || null : null
  const sourceProductId =
    sku && /^\d+$/.test(sku)
      ? sku
      : extractTechnolifeProductId(new URL(pageUrl).pathname)

  // SPA / soft-found pages often return site chrome without Product JSON-LD
  if (!product) {
    return {
      sourceUrl: pageUrl,
      sourceProductId,
      name: null,
      brandRaw: null,
      brandFa: null,
      brandEn: null,
      model: null,
      description: null,
      shortDescription: null,
      priceRial: null,
      oldPriceRial: null,
      priceCurrency: null,
      discountPercent: null,
      availability: 'unknown',
      availabilityText: null,
      images: [],
      specs: [],
      variants: [],
      categoryPath,
      sku: null,
    }
  }

  const specs = extractSpecsFromHtml(html)
  const variants = extractVariantsFromHtml(html)

  // Model heuristic from title
  let model: string | null = null
  if (name) {
    const modelMatch = name.match(
      /(?:مدل|Model)\s+([A-Za-z0-9][A-Za-z0-9\-_. ]{1,40})/i
    )
    if (modelMatch) model = normalizePersianText(modelMatch[1])
  }

  let availability = offer.availability
  if (availability === 'unknown') {
    if (/ناموجود|اتمام موجودی/i.test(html)) availability = 'out_of_stock'
    else if (/افزودن به سبد|موجود در انبار/i.test(html)) availability = 'in_stock'
  }

  let priceRial = offer.priceRial
  let oldPriceRial = offer.oldPriceRial
  let priceCurrency = offer.currency
  if (priceRial == null) {
    // Fallback: meta product:price:amount or visible تومان/ریال text near price widgets
    const metaPrice =
      metaContent(html, 'product:price:amount') ||
      metaContent(html, 'og:price:amount')
    const parsedMeta = parsePriceNumber(metaPrice)
    if (parsedMeta != null) {
      priceRial = parsedMeta
      priceCurrency =
        metaContent(html, 'product:price:currency') ||
        metaContent(html, 'og:price:currency') ||
        'IRR'
    } else {
      const tomanMatch = html.match(/([\d٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹,]{4,})\s*تومان/)
      const rialMatch = html.match(/([\d٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹,]{5,})\s*ریال/)
      if (tomanMatch) {
        const toman = parsePriceNumber(tomanMatch[1])
        if (toman != null) {
          priceRial = toman * 10
          priceCurrency = 'IRR'
        }
      } else if (rialMatch) {
        priceRial = parsePriceNumber(rialMatch[1])
        priceCurrency = 'IRR'
      }
    }
  }

  return {
    sourceUrl: pageUrl,
    sourceProductId,
    name,
    brandRaw: brandRaw || null,
    brandFa: brandParts.fa,
    brandEn: brandParts.en,
    model,
    description,
    shortDescription: description ? description.slice(0, 220) : null,
    priceRial,
    oldPriceRial,
    priceCurrency,
    discountPercent: null,
    availability,
    availabilityText: offer.availabilityText,
    images,
    specs,
    variants,
    categoryPath,
    sku,
  }
}
