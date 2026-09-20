import { normalizePersianText, splitTechnolifeBrand } from '#services/technolife/persian'
import { parsePriceNumber } from '#services/technolife/price'
import { normalizeImageUrl } from '#services/technolife/url'
import type {
  TechnolifeAvailability,
  TechnolifeColor,
  TechnolifeSpec,
  TechnolifeVariantOption,
} from '#services/technolife/types'

type AnyRecord = Record<string, unknown>

export type TechnolifeNextProduct = {
  title: string | null
  brandRaw: string | null
  brandFa: string | null
  brandEn: string | null
  model: string | null
  shortDescription: string | null
  reviewHtml: string | null
  reviewImages: string[]
  priceAmount: number | null
  oldPriceAmount: number | null
  priceCurrency: 'IRT'
  availability: TechnolifeAvailability
  availabilityText: string | null
  stock: number | null
  images: string[]
  colors: TechnolifeColor[]
  specs: TechnolifeSpec[]
  variants: TechnolifeVariantOption[]
  sku: string | null
}

function record(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : null
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function extractNextData(html: string): AnyRecord | null {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match?.[1]) return null

  try {
    return record(JSON.parse(match[1]))
  } catch {
    return null
  }
}

function findProductPageData(nextData: AnyRecord): AnyRecord | null {
  const props = record(nextData.props)
  const pageProps = record(props?.pageProps)
  const dehydrated = record(pageProps?.dehydratedState)
  const queries = array(dehydrated?.queries)

  for (const query of queries) {
    const state = record(record(query)?.state)
    const data = record(state?.data)
    if (record(data?.product_info)) return data
  }
  return null
}

function imageValue(value: unknown): string {
  const image = record(value)
  return typeof image?.image === 'string' ? image.image : ''
}

function isVideoMedia(url: string, value?: AnyRecord | null): boolean {
  return (
    Boolean(value?.video_src) || /\/video\/hls\/|\/thumbnail\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url)
  )
}

function uniqueImages(values: string[], pageUrl: string): string[] {
  const result: string[] = []
  for (const value of values) {
    const normalized = normalizeImageUrl(value, pageUrl)
    if (normalized && !result.includes(normalized)) result.push(normalized)
  }
  return result
}

function extractReviewImages(reviewHtml: string, pageUrl: string): string[] {
  const values = [...reviewHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1] || ''
  )
  return uniqueImages(values, pageUrl)
}

function normalizeStock(value: unknown): number | null {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  return Math.floor(number)
}

function selectPrimaryOffer(items: AnyRecord[]): AnyRecord | null {
  return (
    items.find((item) => (normalizeStock(item.in_stock) ?? 0) > 0) ||
    items.find((item) => Number(item.available) > 0) ||
    items[0] ||
    null
  )
}

function extractSpecs(groups: unknown): TechnolifeSpec[] {
  const specs: TechnolifeSpec[] = []
  const seen = new Set<string>()

  for (const rawGroup of array(groups)) {
    const group = record(rawGroup)
    const groupTitle =
      normalizePersianText(String(group?.title || group?.name || group?.subject || '')) || undefined
    for (const rawInfo of array(group?.info)) {
      const info = record(rawInfo)
      const key = normalizePersianText(String(info?.item || info?.title || '')).replace(/\s*:\s*$/, '')
      const value = normalizePersianText(String(info?.value || info?.text || ''))
      if (!key || !value) continue
      const signature = `${groupTitle || ''}\u0000${key}\u0000${value}`
      if (seen.has(signature)) continue
      seen.add(signature)
      specs.push(groupTitle ? { key, value, group: groupTitle } : { key, value })
    }
  }
  return specs
}

export function parseTechnolifeNextState(
  html: string,
  pageUrl: string
): TechnolifeNextProduct | null {
  const nextData = extractNextData(html)
  if (!nextData) return null
  const data = findProductPageData(nextData)
  const product = record(data?.product_info)
  if (!product) return null

  const colorItems = array(product.color_items)
    .map(record)
    .filter((item): item is AnyRecord => Boolean(item))
  const offer = selectPrimaryOffer(colorItems)

  const priceAmount =
    parsePriceNumber(offer?.discounted_price as never) ?? parsePriceNumber(offer?.price as never)
  const listPrice = parsePriceNumber(offer?.price as never)
  const oldPriceAmount =
    listPrice !== null && priceAmount !== null && listPrice > priceAmount ? listPrice : null

  const stock = normalizeStock(offer?.in_stock)
  const isAvailable =
    (stock ?? 0) > 0 ||
    Number(offer?.available) > 0 ||
    product.is_available === true ||
    Number(product.is_available) > 0
  const availability: TechnolifeAvailability = isAvailable ? 'in_stock' : 'out_of_stock'

  const mainImage = imageValue(product.main_image)
  const subImages = array(product.sub_images)
    .map(record)
    .filter((item): item is AnyRecord => Boolean(item))
    .map((item) => ({ item, url: imageValue(item) }))
    .filter(({ item, url }) => url && !isVideoMedia(url, item))
    .map(({ url }) => url)
  const colorImageValues = colorItems.map((item) => imageValue(item.image)).filter(Boolean)
  const images = uniqueImages(
    [mainImage, ...subImages, ...(mainImage || subImages.length ? [] : colorImageValues)],
    pageUrl
  )

  const colors: TechnolifeColor[] = []
  const variants: TechnolifeVariantOption[] = []
  for (const item of colorItems) {
    const color = record(item.color)
    const name = normalizePersianText(String(color?.value || ''))
    if (!name || colors.some((entry) => entry.name === name)) continue
    const hex = String(color?.code || '').trim()
    const image = normalizeImageUrl(imageValue(item.image), pageUrl) || undefined
    colors.push({
      name,
      hex: /^#[\da-f]{3,8}$/i.test(hex) ? hex : '#808080',
      ...(image ? { image } : {}),
    })
    variants.push({ axis: 'color', label: name, ...(hex ? { value: hex } : {}) })
  }

  const reviewHtml =
    typeof data?.product_review === 'string' && data.product_review.trim()
      ? data.product_review.trim()
      : null
  const brandRecord = record(product.brand)
  // Technolife may send "فا|En" in `name`, or separate Persian `name` + Latin `enName`.
  const brandNameFa = normalizePersianText(String(brandRecord?.name || ''))
  const brandNameEn = normalizePersianText(String(brandRecord?.enName || ''))
  let brandRaw = brandNameFa
  if (brandNameFa.includes('|')) {
    brandRaw = brandNameFa
  } else if (brandNameFa && brandNameEn && brandNameFa !== brandNameEn) {
    brandRaw = `${brandNameFa}|${brandNameEn}`
  } else {
    brandRaw = brandNameFa || brandNameEn
  }
  const brand = splitTechnolifeBrand(brandRaw)
  const technicalCode = normalizePersianText(String(product.technical_code || ''))
  const productCode = normalizePersianText(String(product.code || ''))
  const sourceCode = productCode.replace(/^TLP-/i, '')
  const sku =
    technicalCode && technicalCode !== productCode && technicalCode !== sourceCode
      ? technicalCode
      : null

  return {
    title: normalizePersianText(String(product.title || '')) || null,
    brandRaw: brandRaw || null,
    brandFa: brand.fa,
    brandEn: brand.en,
    model: normalizePersianText(String(product.model || '')) || null,
    shortDescription: normalizePersianText(String(product.meta_description || '')) || null,
    reviewHtml,
    reviewImages: reviewHtml ? extractReviewImages(reviewHtml, pageUrl) : [],
    priceAmount,
    oldPriceAmount,
    priceCurrency: 'IRT',
    availability,
    availabilityText: normalizePersianText(String(offer?.stock_text || '')) || null,
    stock,
    images,
    colors,
    specs: extractSpecs(data?.configurations_component),
    variants,
    sku,
  }
}
