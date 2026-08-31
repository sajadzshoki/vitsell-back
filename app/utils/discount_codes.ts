import DiscountCode from '#models/discount_code'
import Order from '#models/order'
import { DateTime } from 'luxon'

export class DiscountResolveError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message)
  }
}

export async function resolveDiscountAmount(options: {
  code: string
  subtotal: number
  userId: number | string
}) {
  const normalized = options.code.trim().toUpperCase()
  const row = await DiscountCode.find(normalized)
  if (!row || !row.isLive()) {
    throw new DiscountResolveError('discountCode', 'کد تخفیف نامعتبر است')
  }
  if (!row.meetsMinAmount(options.subtotal)) {
    throw new DiscountResolveError(
      'discountCode',
      `حداقل مبلغ سفارش برای این کد ${Number(row.minAmount).toLocaleString('fa-IR')} تومان است`
    )
  }
  if (row.oncePerUser) {
    const used = await Order.query()
      .where('user_id', options.userId)
      .where('discount_code', normalized)
      .whereNot('status', 'cancelled')
      .first()
    if (used) {
      throw new DiscountResolveError('discountCode', 'این کد قبلاً توسط شما استفاده شده است')
    }
  }

  return {
    code: normalized,
    amount: Math.floor(options.subtotal * Number(row.percent)),
    row,
  }
}

/** @deprecated kept for call sites that only need live check */
export function isDiscountLive(row: DiscountCode, now = DateTime.utc()) {
  return row.isLive(now)
}
