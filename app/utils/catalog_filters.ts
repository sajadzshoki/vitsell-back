import Category from '#models/category'
import Product from '#models/product'
import ProductAttribute from '#models/product_attribute'
import { expandBrandNameAliases } from '#services/technolife/brand_mapper'
import { normalizePersianText, toAsciiDigits } from '#services/technolife/persian'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type CatalogFilterInput = {
  q?: string
  category?: string
  /** Pre-resolved category tree ids (self + descendants). Prefer over exact `category`. */
  categoryIds?: string[]
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  onlyDiscount?: boolean
  onlyInStock?: boolean
  fastDelivery?: boolean
  minRating?: number
  /** Raw slug → values (e.g. mega-menu). Prefer `resolvedAttrs` for product queries. */
  attrs?: Record<string, string[]>
  /**
   * Pre-resolved attribute filters (sync-safe). Prefer this over raw `attrs` —
   * Knex/Lucid `where` callbacks cannot await async lookups.
   */
  resolvedAttrs?: ResolvedAttrFilter[]
}

export type ResolvedAttrFilter = {
  slug: string
  id?: string
  name?: string
  type?: string
  /** Distinct ILIKE / equality needles for this attribute selection */
  needles: string[]
}

type ProductQuery = ModelQueryBuilderContract<typeof Product, Product>

/** Coarse product-type / line synonyms (any hit expands to the whole group). */
const CATEGORY_SYNONYM_GROUPS: string[][] = [
  ['گوشی', 'موبایل', 'موبايل', 'mobile', 'phone'],
  // آ vs ا: both spellings kept so ILIKE still hits DB titles that use آیفون
  ['آیفون', 'ایفون', 'iphone', 'iPhone'],
  ['تبلت', 'tablet', 'ipad'],
  ['لپ تاپ', 'لپ‌تاپ', 'لپتاپ', 'laptop', 'notebook', 'macbook'],
  ['ساعت', 'ساعت هوشمند', 'watch', 'smartwatch'],
  ['هدفون', 'هدفونی', 'ایرپاد', 'headphone', 'earbud', 'earbuds', 'airpods'],
  ['کنسول', 'بازی', 'gaming', 'playstation', 'xbox', 'ps5'],
]

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

function escapeLike(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/** Expand a filter token into ASCII/Persian capacity + label variants for ILIKE. */
function expandNeedleVariants(raw: string): string[] {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return []
  const out = new Set<string>([trimmed])
  const normalized = normalizePersianText(trimmed)
  if (normalized) out.add(normalized)

  const ascii = toAsciiDigits(trimmed).trim()
  if (ascii) out.add(ascii)

  const capacity = normalized.match(
    /(\d+(?:\.\d+)?)\s*(gb|tb|mb|گیگابایت|گیگ|ترابایت|مگابایت)?/i
  )
  if (capacity?.[1]) {
    const num = capacity[1]
    const unitRaw = (capacity[2] || '').toLowerCase()
    const isTb = /tb|ترابایت/.test(unitRaw)
    const isMb = /mb|مگابایت/.test(unitRaw)
    if (isTb) {
      out.add(`${num}TB`)
      out.add(`${num} TB`)
      out.add(`${num}ترابایت`)
      out.add(`${num} ترابایت`)
    } else if (isMb) {
      out.add(`${num}MB`)
      out.add(`${num} MB`)
    } else {
      // default / explicit GB — covers ram + storage filter values like 8gb
      out.add(`${num}GB`)
      out.add(`${num} GB`)
      out.add(`${num}گیگابایت`)
      out.add(`${num} گیگابایت`)
      out.add(`${num}گیگ`)
      out.add(`${num} گیگ`)
    }
  }

  return [...out].map((s) => s.trim()).filter(Boolean)
}

/**
 * Resolve raw slug→values filters into sync-safe needles.
 * Must run **before** building the product query (async attribute lookup).
 */
export async function resolveAttributeFilters(
  attrs: Record<string, string[]>
): Promise<ResolvedAttrFilter[]> {
  const entries = Object.entries(attrs).filter(([, values]) => values.length)
  if (!entries.length) return []

  const slugs = entries.map(([slug]) => slug)
  const attributes = await ProductAttribute.query()
    .whereIn('slug', slugs)
    .where('status', 'active')
  const bySlug = new Map(attributes.map((a) => [a.slug, a]))

  const resolved: ResolvedAttrFilter[] = []
  for (const [slug, selected] of entries) {
    const attr = bySlug.get(slug)
    const valueSet = new Set(
      selected.flatMap((v) => expandNeedleVariants(v).map((x) => x.toLowerCase()))
    )

    const fromCatalog = (attr?.values || [])
      .filter((v) => {
        const candidates = [v.value, v.label, v.id, v.meta]
          .filter(Boolean)
          .flatMap((x) => expandNeedleVariants(String(x)))
        return candidates.some((c) => valueSet.has(c.toLowerCase()))
      })
      .flatMap((v) => [v.label, v.value, v.id, v.meta].filter(Boolean).map(String))

    const needles = Array.from(
      new Set(
        [...selected, ...fromCatalog]
          .flatMap((s) => expandNeedleVariants(s))
          .map((s) => s.trim())
          .filter(Boolean)
      )
    )
    if (!needles.length) continue

    resolved.push({
      slug,
      id: attr?.id,
      name: attr?.name,
      type: attr?.type,
      needles,
    })
  }
  return resolved
}

/** Self + all descendant category ids (BFS on parent_id). */
export async function resolveCategoryTreeIds(categoryId: string): Promise<string[]> {
  const root = String(categoryId || '').trim()
  if (!root) return []
  const ids = new Set<string>([root])
  let frontier = [root]
  while (frontier.length) {
    const children = await Category.query().whereIn('parent_id', frontier).select('id')
    frontier = []
    for (const child of children) {
      if (ids.has(child.id)) continue
      ids.add(child.id)
      frontier.push(child.id)
    }
  }
  return [...ids]
}

export function expandBrandFilterValues(brands: string[]): string[] {
  const out = new Set<string>()
  for (const brand of brands) {
    for (const alias of expandBrandNameAliases(brand)) {
      out.add(alias)
    }
  }
  return [...out]
}

function expandSearchToken(token: string): string[] {
  const normalized = normalizePersianText(token)
  if (!normalized) return []
  const key = normalized.toLowerCase()
  const patterns = new Set<string>([normalized, token.trim()].filter(Boolean))

  for (const group of CATEGORY_SYNONYM_GROUPS) {
    if (group.some((g) => normalizePersianText(g).toLowerCase() === key)) {
      for (const g of group) patterns.add(g)
    }
  }

  for (const alias of expandBrandNameAliases(normalized)) {
    patterns.add(alias)
  }

  return [...patterns].filter(Boolean)
}

function tokenizeSearchQuery(q: string): string[] {
  const normalized = normalizePersianText(q)
  if (!normalized) return []
  return normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
}

function applyTokenMatch(
  builder: ModelQueryBuilderContract<typeof Product, Product>,
  patterns: string[]
) {
  builder.where((group) => {
    for (const pattern of patterns) {
      const like = `%${pattern}%`
      group
        .orWhereILike('title', like)
        .orWhereILike('brand', like)
        .orWhereILike('category_label', like)
        .orWhereILike('short_name', like)
        .orWhereRaw(
          `EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb)) AS t
            WHERE t ILIKE ?
          )`,
          [like]
        )
    }
  })
}

/**
 * Apply catalog filters. Keep this function **synchronous** — Lucid/Knex
 * query builders are thenable; returning them from `async` executes the query.
 */
export function applyCatalogFilters(
  query: ProductQuery,
  input: CatalogFilterInput,
  opts?: { skipPrice?: boolean; skipBrands?: boolean; skipAttrs?: boolean }
) {
  const category = String(input.category || '').trim()
  const categoryIds = (input.categoryIds || []).map(String).filter(Boolean)
  const q = String(input.q || '').trim()
  const brands = (input.brands || []).map(String).filter(Boolean)
  const minPrice = Number(input.minPrice || 0) || 0
  const maxPrice = Number(input.maxPrice || 0) || 0

  if (categoryIds.length) {
    query = categoryIds.length === 1
      ? query.where('category', categoryIds[0]!)
      : query.whereIn('category', categoryIds)
  } else if (category) {
    query = query.where('category', category)
  }

  if (!opts?.skipBrands && brands.length) {
    const expanded = expandBrandFilterValues(brands)
    query = query.whereIn('brand', expanded.length ? expanded : brands)
  }

  if (!opts?.skipPrice) {
    if (minPrice > 0) query = query.where('price', '>=', minPrice)
    if (maxPrice > 0) query = query.where('price', '<=', maxPrice)
  }
  if (input.onlyDiscount) query = query.whereNotNull('old_price')
  if (input.onlyInStock) {
    // Include products whose sellable stock lives on active variants even when
    // products.in_stock / listing rows are stale (common after variant edits).
    query = query.where((group) => {
      group
        .where('in_stock', true)
        .orWhereRaw(
          `EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(variants, '[]'::jsonb)) AS v
            WHERE COALESCE(v->>'status', 'active') = 'active'
              AND COALESCE((v->>'stock')::int, 0) > 0
          )`
        )
    })
  }
  if (input.fastDelivery) query = query.where('fast_delivery', true)
  const minRating = Number(input.minRating || 0) || 0
  if (minRating > 0) query = query.where('rating', '>=', minRating)

  if (q) {
    const tokens = tokenizeSearchQuery(q)
    if (tokens.length) {
      query = query.where((outer) => {
        for (const token of tokens) {
          const patterns = expandSearchToken(token)
          if (!patterns.length) continue
          outer.where((tokenGroup) => {
            applyTokenMatch(tokenGroup, patterns)
          })
        }
      })
    }
  }

  if (!opts?.skipAttrs && input.resolvedAttrs?.length) {
    query = applyResolvedAttributeFilters(query, input.resolvedAttrs)
  }

  return query
}

function applyResolvedAttributeFilters(query: ProductQuery, attrs: ResolvedAttrFilter[]) {
  if (!attrs.length) return query

  return query.where((builder) => {
    for (const attr of attrs) {
      const needles = attr.needles.filter(Boolean)
      if (!needles.length) continue

      const isColor = attr.type === 'color' || attr.slug === 'color'
      const attrName = String(attr.name || '').trim()
      const attrId = String(attr.id || '').trim()

      builder.where((group) => {
        for (const needle of needles) {
          const like = `%${escapeLike(needle)}%`

          if (isColor) {
            group.orWhereRaw(
              `EXISTS (
                SELECT 1
                FROM jsonb_array_elements(COALESCE(colors, '[]'::jsonb)) AS c
                WHERE (c->>'name') ILIKE ? ESCAPE '\\'
                   OR (c->>'hex') ILIKE ? ESCAPE '\\'
              )`,
              [like, like]
            )
          }

          // Specs: key matches attribute name (when known), value matches needle
          group.orWhereRaw(
            `EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(specs, '[]'::jsonb)) AS s
              WHERE (
                (? = '' OR (s->>'key') ILIKE ? ESCAPE '\\')
                AND (s->>'value') ILIKE ? ESCAPE '\\'
              )
            )`,
            [
              attrName,
              attrName ? `%${escapeLike(attrName)}%` : '%',
              like,
            ]
          )

          // Variant options (color / storage / ram axes on imported products)
          group.orWhereRaw(
            `EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(variants, '[]'::jsonb)) AS v
              CROSS JOIN LATERAL jsonb_array_elements(
                CASE
                  WHEN jsonb_typeof(v->'options') = 'array' THEN v->'options'
                  ELSE '[]'::jsonb
                END
              ) AS o
              WHERE (
                (? = '' OR (o->>'attributeId') = ? OR (o->>'attributeName') ILIKE ? ESCAPE '\\')
                AND (
                  (o->>'label') ILIKE ? ESCAPE '\\'
                  OR (o->>'valueId') ILIKE ? ESCAPE '\\'
                  OR COALESCE(o->>'meta', '') ILIKE ? ESCAPE '\\'
                )
              )
            )`,
            [
              attrId || attrName,
              attrId,
              attrName ? `%${escapeLike(attrName)}%` : '%',
              like,
              like,
              like,
            ]
          )

          // Title fallback (storage / ram often appear in titles)
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
