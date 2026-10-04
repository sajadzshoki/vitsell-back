import SellerShippingMethod from '#models/seller_shipping_method'
import { moneyAmount } from '#utils/money'

const LEGACY_METHOD_IDS: Record<string, string> = {
  express: 'ship-express',
  post: 'ship-post',
  pickup: 'ship-pickup',
}

const FALLBACK_METHODS: Record<
  string,
  { id: string, name: string, carrier: string, baseCost: number, status: 'active' }
> = {
  'ship-express': {
    id: 'ship-express',
    name: 'پیک اکسپرس',
    carrier: 'ویتسل',
    baseCost: 45_000,
    status: 'active',
  },
  'ship-post': {
    id: 'ship-post',
    name: 'پست پیشتاز',
    carrier: 'پست ایران',
    baseCost: 40_000,
    status: 'active',
  },
  'ship-pickup': {
    id: 'ship-pickup',
    name: 'دریافت حضوری',
    carrier: 'فروشگاه',
    baseCost: 0,
    status: 'active',
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
) {
  if (isPickupShipping(method) || subtotal <= 0) return 0
  const base = moneyAmount(method.baseCost)
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
