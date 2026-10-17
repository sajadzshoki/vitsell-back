import SellerShippingMethod from '#models/seller_shipping_method'
import { moneyAmount } from '#utils/money'
import { resolveMethodPrice } from '#utils/shipping_slots'

const LEGACY_METHOD_IDS: Record<string, string> = {
  express: 'ship-express',
  post: 'ship-post',
  pickup: 'ship-pickup',
}

const FALLBACK_METHODS: Record<
  string,
  {
    id: string
    name: string
    carrier: string
    baseCost: number
    status: 'active'
    coverage: 'nationwide' | 'cities'
    slotsEnabled: boolean
    expressEnabled: boolean
    expressPrice: number
    expressDeadlineHour: number
    holidayMode: 'use_weekday'
  }
> = {
  'ship-express': {
    id: 'ship-express',
    name: 'پیک اکسپرس',
    carrier: 'ویتسل',
    baseCost: 45_000,
    status: 'active',
    coverage: 'cities',
    slotsEnabled: true,
    expressEnabled: true,
    expressPrice: 75_000,
    expressDeadlineHour: 12,
    holidayMode: 'use_weekday',
  },
  'ship-post': {
    id: 'ship-post',
    name: 'پست پیشتاز',
    carrier: 'پست ایران',
    baseCost: 40_000,
    status: 'active',
    coverage: 'nationwide',
    slotsEnabled: false,
    expressEnabled: false,
    expressPrice: 0,
    expressDeadlineHour: 12,
    holidayMode: 'use_weekday',
  },
  'ship-pickup': {
    id: 'ship-pickup',
    name: 'دریافت حضوری',
    carrier: 'فروشگاه',
    baseCost: 0,
    status: 'active',
    coverage: 'nationwide',
    slotsEnabled: false,
    expressEnabled: false,
    expressPrice: 0,
    expressDeadlineHour: 12,
    holidayMode: 'use_weekday',
  },
}

export function isPickupShipping(method: { id: string, name: string }) {
  const id = String(method.id || '').toLowerCase()
  const name = String(method.name || '')
  return id.includes('pickup') || name.includes('حضوری')
}

export function shippingCostForMethod(
  method: { id: string, name: string, baseCost: number | bigint | string },
  subtotal: number,
  freeShippingThreshold: number,
  overridePrice?: number | null
) {
  if (isPickupShipping(method) || subtotal <= 0) return 0
  const base = overridePrice != null ? moneyAmount(overridePrice) : moneyAmount(method.baseCost)
  if (base <= 0) return 0
  const threshold = freeShippingThreshold > 0 ? freeShippingThreshold : 0
  if (threshold > 0 && subtotal >= threshold) return 0
  return base
}

export function shippingMethodLabel(method: { name: string, carrier?: string | null }) {
  const name = String(method.name || '').trim()
  const carrier = String(method.carrier || '').trim()
  return carrier ? `${name} · ${carrier}` : name
}

export async function resolveCheckoutShippingMethod(rawId: string) {
  const raw = String(rawId || '').trim()
  if (!raw) return null
  const mapped = LEGACY_METHOD_IDS[raw] || raw
  const method =
    (await SellerShippingMethod.find(mapped))
    || (mapped !== raw ? await SellerShippingMethod.find(raw) : null)
  if (method && method.status === 'active') return method
  const fallback = FALLBACK_METHODS[mapped] || FALLBACK_METHODS[raw]
  return fallback ?? null
}

export async function listStorefrontMethodsForCity(province?: string | null, city?: string | null) {
  const rows = await SellerShippingMethod.query()
    .where('status', 'active')
    .orderBy('sort_order', 'asc')
    .orderBy('id', 'asc')

  const items: ReturnType<SellerShippingMethod['toStorefrontJSON']>[] = []
  for (const row of rows) {
    const priced = await resolveMethodPrice(row, province, city)
    if (!priced.ok) continue
    items.push(row.toStorefrontJSON({ price: priced.price }))
  }
  return items
}
