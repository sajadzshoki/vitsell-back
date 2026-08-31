import { DateTime } from 'luxon'
import Product from '#models/product'
import UserActivity from '#models/user_activity'
import type { ActivityEventType } from '#models/user_activity'
import CartItem from '#models/cart_item'
import WishlistItem from '#models/wishlist_item'

const EVENT_WEIGHTS: Record<ActivityEventType, number> = {
  product_view: 1,
  category_view: 3,
  search: 2,
  add_to_cart: 5,
  wishlist: 4,
}

const MAX_STORED_EVENTS = 400

export type IncomingActivity = {
  type: ActivityEventType
  productId?: string | null
  category?: string | null
  query?: string | null
  at?: number | string | null
}

function isValidType(value: string): value is ActivityEventType {
  return value in EVENT_WEIGHTS
}

function parseOccurredAt(value: number | string | null | undefined): DateTime {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return DateTime.fromMillis(value)
  }
  if (typeof value === 'string' && value.trim()) {
    const fromIso = DateTime.fromISO(value)
    if (fromIso.isValid) return fromIso
    const asNum = Number(value)
    if (Number.isFinite(asNum)) return DateTime.fromMillis(asNum)
  }
  return DateTime.utc()
}

export async function storeActivities(userId: number, events: IncomingActivity[]) {
  const rows = events
    .filter((e) => e && isValidType(String(e.type)))
    .slice(0, 100)
    .map((e) => ({
      userId,
      eventType: e.type as ActivityEventType,
      productId: e.productId ? String(e.productId) : null,
      category: e.category ? String(e.category).trim().slice(0, 64) : null,
      query: e.query ? String(e.query).trim().slice(0, 255) : null,
      occurredAt: parseOccurredAt(e.at ?? null),
    }))

  if (!rows.length) return { stored: 0 }

  await UserActivity.createMany(rows)
  await pruneUserActivities(userId)
  return { stored: rows.length }
}

async function pruneUserActivities(userId: number) {
  const ids = await UserActivity.query()
    .where('user_id', userId)
    .orderBy('occurred_at', 'desc')
    .select('id')

  if (ids.length <= MAX_STORED_EVENTS) return

  const dropIds = ids.slice(MAX_STORED_EVENTS).map((r) => r.id)
  await UserActivity.query().whereIn('id', dropIds).delete()
}

function bump(scores: Map<string, number>, category: string | null | undefined, weight: number) {
  const key = (category ?? '').trim()
  if (!key || weight <= 0) return
  scores.set(key, (scores.get(key) ?? 0) + weight)
}

export async function scoreCategoriesForUser(
  userId: number,
  hintCategories: string[] = []
): Promise<string[]> {
  const scores = new Map<string, number>()

  for (const cat of hintCategories) {
    bump(scores, cat, 2)
  }

  const activities = await UserActivity.query()
    .where('user_id', userId)
    .orderBy('occurred_at', 'desc')
    .limit(300)

  for (const row of activities) {
    bump(scores, row.category, EVENT_WEIGHTS[row.eventType] ?? 1)
  }

  const [cartItems, wishlistItems] = await Promise.all([
    CartItem.query().where('user_id', userId).preload('product'),
    WishlistItem.query().where('user_id', userId).preload('product'),
  ])

  for (const item of cartItems) {
    bump(scores, item.product?.category, EVENT_WEIGHTS.add_to_cart)
  }
  for (const item of wishlistItems) {
    bump(scores, item.product?.category, EVENT_WEIGHTS.wishlist)
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
    .slice(0, 3)
}

export async function recommendProducts(options: {
  categories: string[]
  excludeProductIds?: string[]
  limit?: number
}) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 24)
  const exclude = new Set((options.excludeProductIds ?? []).filter(Boolean))
  const categories = options.categories.filter(Boolean).slice(0, 3)

  const collected: Product[] = []
  const seen = new Set<string>()

  const pushUnique = (products: Product[]) => {
    for (const p of products) {
      if (seen.has(p.id) || exclude.has(p.id)) continue
      seen.add(p.id)
      collected.push(p)
      if (collected.length >= limit) return true
    }
    return false
  }

  if (categories.length) {
    const perCategory = Math.ceil(limit / categories.length) + 2
    for (const category of categories) {
      const rows = await Product.query()
        .where('category', category)
        .where('in_stock', true)
        .orderBy('sold_count', 'desc')
        .orderBy('rating', 'desc')
        .limit(perCategory)
      if (pushUnique(rows)) break
    }
  }

  if (collected.length < limit) {
    const fallback = await Product.query()
      .where('in_stock', true)
      .orderBy('sold_count', 'desc')
      .orderBy('rating', 'desc')
      .limit(limit + exclude.size)
    pushUnique(fallback)
  }

  return {
    items: collected.slice(0, limit).map((p) => p.toCatalogJSON()),
    personalized: categories.length > 0,
    categories,
  }
}
