import { randomInt, timingSafeEqual } from 'node:crypto'

/** Stable 6-digit code stored on the seller order. Not a secret from the buyer. */
export function generateDeliveryCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** Constant-time compare. Length mismatches never match. */
export function deliveryCodesMatch(stored: string, attempt: string) {
  const left = Buffer.from(String(stored ?? ''))
  const right = Buffer.from(String(attempt ?? ''))
  const len = Math.max(left.length, right.length, 1)
  const a = Buffer.alloc(len)
  const b = Buffer.alloc(len)
  left.copy(a)
  right.copy(b)
  const equal = timingSafeEqual(a, b)
  return equal && left.length === right.length && left.length > 0
}
