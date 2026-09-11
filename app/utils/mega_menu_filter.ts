import type { CatalogFilterInput } from '#utils/catalog_filters'

/** Stored on MegaMenuItem when type === 'filter'. Reuses product catalog filter shape. */
export type MegaMenuFilterDefinition = {
  category?: string
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  attrs?: Record<string, string[]>
  q?: string
  onlyDiscount?: boolean
  onlyInStock?: boolean
  fastDelivery?: boolean
  minRating?: number
}

function asStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function asAttrs(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Record<string, string[]> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const slug = String(key || '').trim()
    if (!slug) continue
    const values = asStringArray(raw)
    if (values.length) out[slug] = values
  }
  return Object.keys(out).length ? out : undefined
}

/** Normalize / validate filter JSON for storage. Returns null if empty. */
export function normalizeMegaMenuFilter(raw: unknown): MegaMenuFilterDefinition | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const src = raw as Record<string, unknown>

  const category = String(src.category || '').trim() || undefined
  const brands = asStringArray(src.brands)
  const minPrice = Number(src.minPrice || 0) || 0
  const maxPrice = Number(src.maxPrice || 0) || 0
  const attrs = asAttrs(src.attrs)
  const q = String(src.q || '').trim() || undefined
  const onlyDiscount = Boolean(src.onlyDiscount)
  const onlyInStock = Boolean(src.onlyInStock)
  const fastDelivery = Boolean(src.fastDelivery)
  const minRating = Number(src.minRating || 0) || 0

  const next: MegaMenuFilterDefinition = {}
  if (category) next.category = category
  if (brands.length) next.brands = brands
  if (minPrice > 0) next.minPrice = minPrice
  if (maxPrice > 0) next.maxPrice = maxPrice
  if (attrs) next.attrs = attrs
  if (q) next.q = q
  if (onlyDiscount) next.onlyDiscount = true
  if (onlyInStock) next.onlyInStock = true
  if (fastDelivery) next.fastDelivery = true
  if (minRating > 0) next.minRating = minRating

  return Object.keys(next).length ? next : null
}

export function megaMenuFilterToCatalogInput(
  filter: MegaMenuFilterDefinition | null | undefined
): CatalogFilterInput {
  if (!filter) return {}
  return {
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.brands?.length ? { brands: filter.brands } : {}),
    ...(filter.minPrice ? { minPrice: filter.minPrice } : {}),
    ...(filter.maxPrice ? { maxPrice: filter.maxPrice } : {}),
    ...(filter.attrs ? { attrs: filter.attrs } : {}),
    ...(filter.q ? { q: filter.q } : {}),
    ...(filter.onlyDiscount ? { onlyDiscount: true } : {}),
    ...(filter.onlyInStock ? { onlyInStock: true } : {}),
    ...(filter.fastDelivery ? { fastDelivery: true } : {}),
    ...(filter.minRating ? { minRating: filter.minRating } : {}),
  }
}

export function parseStoredFilter(value: unknown): MegaMenuFilterDefinition | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return normalizeMegaMenuFilter(JSON.parse(value))
    } catch {
      return null
    }
  }
  return normalizeMegaMenuFilter(value)
}
