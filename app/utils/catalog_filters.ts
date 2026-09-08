import Product from '#models/product'
import ProductAttribute from '#models/product_attribute'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type CatalogFilterInput = {
  q?: string
  category?: string
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  onlyDiscount?: boolean
  onlyInStock?: boolean
  fastDelivery?: boolean
  minRating?: number
  /** slug → selected attribute values */
  attrs?: Record<string, string[]>
}

type ProductQuery = ModelQueryBuilderContract<typeof Product, Product>

export function parseAttrFilters(raw: unknown): Record<string, string[]> {
  if (!raw) return {}
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return {}
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      // storage:128gb|256gb,ram:8gb
      const out: Record<string, string[]> = {}
      for (const part of trimmed.split(',')) {
        const [slug, values] = part.split(':')
        const key = String(slug || '').trim()
        if (!key || !values) continue
        out[key] = values
          .split('|')
          .map((v) => v.trim())
          .filter(Boolean)
      }
      return out
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const slug = String(key || '').trim()
    if (!slug) continue
    const list = Array.isArray(value)
      ? value.map(String)
      : String(value || '')
          .split(',')
          .map((v) => v.trim())
    const values = list.map((v) => v.trim()).filter(Boolean)
    if (values.length) out[slug] = values
  }
  return out
}

export function applyCatalogFilters(
  query: ProductQuery,
  input: CatalogFilterInput,
  opts?: { skipPrice?: boolean; skipBrands?: boolean; skipAttrs?: boolean }
) {
  const category = String(input.category || '').trim()
  const q = String(input.q || '').trim()
  const brands = (input.brands || []).map(String).filter(Boolean)
  const minPrice = Number(input.minPrice || 0) || 0
  const maxPrice = Number(input.maxPrice || 0) || 0

  if (category) query = query.where('category', category)
  if (!opts?.skipBrands && brands.length) query = query.whereIn('brand', brands)
  if (!opts?.skipPrice) {
    if (minPrice > 0) query = query.where('price', '>=', minPrice)
    if (maxPrice > 0) query = query.where('price', '<=', maxPrice)
  }
  if (input.onlyDiscount) query = query.whereNotNull('old_price')
  if (input.onlyInStock) query = query.where('in_stock', true)
  if (input.fastDelivery) query = query.where('fast_delivery', true)
  if ((input.minRating || 0) > 0) query = query.where('rating', '>=', input.minRating)

  if (q) {
    const like = `%${q}%`
    query = query.where((builder) => {
      builder
        .whereILike('title', like)
        .orWhereILike('brand', like)
        .orWhereILike('category_label', like)
        .orWhereILike('short_name', like)
    })
  }

  if (!opts?.skipAttrs && input.attrs) {
    query = applyAttributeFilters(query, input.attrs)
  }

  return query
}

function applyAttributeFilters(query: ProductQuery, attrs: Record<string, string[]>) {
  const entries = Object.entries(attrs).filter(([, values]) => values.length)
  if (!entries.length) return query

  return query.where(async (builder) => {
    // Resolve attribute metadata once per request scope
    const slugs = entries.map(([slug]) => slug)
    const attributes = await ProductAttribute.query()
      .whereIn('slug', slugs)
      .where('status', 'active')

    const bySlug = new Map(attributes.map((a) => [a.slug, a]))

    for (const [slug, selected] of entries) {
      const attr = bySlug.get(slug)
      const valueSet = selected.map((v) => v.toLowerCase())
      const labels = (attr?.values || [])
        .filter((v) => valueSet.includes(String(v.value || '').toLowerCase())
          || valueSet.includes(String(v.label || '').toLowerCase())
          || valueSet.includes(String(v.id || '').toLowerCase()))
        .flatMap((v) => [v.label, v.value, v.id, v.meta].filter(Boolean).map(String))

      const needles = Array.from(new Set([...selected, ...labels].map((s) => s.trim()).filter(Boolean)))
      if (!needles.length) continue

      builder.where((group) => {
        for (const needle of needles) {
          const like = `%${needle}%`
          if (attr?.type === 'color' || slug === 'color') {
            group.orWhereRaw(
              `EXISTS (
                SELECT 1
                FROM jsonb_array_elements(COALESCE(colors, '[]'::jsonb)) AS c
                WHERE (c->>'name') ILIKE ?
                   OR (c->>'hex') ILIKE ?
              )`,
              [like, like]
            )
          }
          group.orWhereRaw(
            `EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(specs, '[]'::jsonb)) AS s
              WHERE (
                (? = '' OR (s->>'key') ILIKE ?)
                AND (s->>'value') ILIKE ?
              )
            )`,
            [attr?.name || '', attr?.name ? `%${attr.name}%` : '%', like]
          )
          // Also match title for storage sizes etc.
          group.orWhereILike('title', like)
        }
      })
    }
  })
}

export async function loadFilterableAttributes(category?: string) {
  let query = ProductAttribute.query()
    .where('status', 'active')
    .where((builder) => {
      builder.where('filterable', true).orWhere('variant_defining', true)
    })
    .orderBy('sort_order', 'asc')

  const rows = await query
  const cat = String(category || '').trim()
  const filtered = cat
    ? rows.filter((row) => {
        const ids = Array.isArray(row.categoryIds) ? row.categoryIds : []
        return !ids.length || ids.includes(cat)
      })
    : rows.filter((row) => {
        const ids = Array.isArray(row.categoryIds) ? row.categoryIds : []
        return !ids.length
      })

  return filtered.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    values: (row.values || [])
      .filter((v) => v.status !== 'inactive')
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((v) => ({
        id: v.id,
        label: v.label,
        value: v.value,
        ...(v.meta ? { meta: v.meta } : {}),
      })),
  }))
}
