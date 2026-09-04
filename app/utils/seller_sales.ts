import SellerOrder from '#models/seller_order'
import { DateTime } from 'luxon'

const WEEKDAY_FA: Record<number, string> = {
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
  6: 'شنبه',
  7: 'یکشنبه',
}

/** Last 7 days of seller order totals (excludes cancelled/returned), Asia/Tehran. */
export async function computeSellerSalesPoints(): Promise<{ label: string; value: number }[]> {
  const zone = 'Asia/Tehran'
  const today = DateTime.now().setZone(zone).startOf('day')
  const start = today.minus({ days: 6 })
  const startKey = start.toFormat('yyyyMMdd')
  const endKey = today.toFormat('yyyyMMdd')

  const orders = await SellerOrder.query()
    .whereNotIn('status', ['cancelled', 'returned'])
    .where('date_key', '>=', startKey)
    .where('date_key', '<=', endKey)

  const byKey = new Map<string, number>()
  for (const order of orders) {
    const key = String(order.dateKey || '')
    if (!key) continue
    byKey.set(key, (byKey.get(key) ?? 0) + Math.round(Number(order.total) || 0))
  }

  const points: { label: string; value: number }[] = []
  for (let i = 0; i < 7; i++) {
    const day = start.plus({ days: i })
    const key = day.toFormat('yyyyMMdd')
    points.push({
      label: WEEKDAY_FA[day.weekday] ?? day.toFormat('ccc'),
      value: byKey.get(key) ?? 0,
    })
  }
  return points
}
