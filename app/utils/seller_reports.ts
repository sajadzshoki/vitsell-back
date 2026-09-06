import { DateTime } from 'luxon'
import SellerOrder from '#models/seller_order'
import SellerRefund from '#models/seller_refund'
import SellerPayout from '#models/seller_payout'
import { attachOrderListCommerce } from '#utils/seller_order_detail'
import { buildSellerPayments, type SellerPaymentRow } from '#utils/seller_payments_query'
import type { ReportsQuery } from '#validators/reports'

const ZONE = 'Asia/Tehran'

const WEEKDAY_FA: Record<number, string> = {
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
  6: 'شنبه',
  7: 'یکشنبه',
}

export type FinancePeriodId =
  | 'today'
  | 'yesterday'
  | 'last_7'
  | 'last_30'
  | 'this_month'
  | 'last_month'
  | 'custom'

export type FinanceKpiBundle = {
  grossRevenue: number
  netRevenue: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  revenuePrev: number
  revenueChangePct: number | null
  paidOrders: number
  unpaidOrders: number
  failedPayments: number
  refundedOrders: number
  partiallyRefundedOrders: number
  successfulPayments: number
  pendingPayments: number
  failedPaymentCount: number
  paymentVolume: number
  avgTransactionValue: number
  totalRefunded: number
  pendingRefunds: number
  completedRefunds: number
  failedRefunds: number
  pendingReceivables: number
  pendingSettlements: number
  openReconciliationIssues: number
}

type DateRange = {
  start: DateTime
  end: DateTime
  previousStart: DateTime
  previousEnd: DateTime
}

function emptyKpis(): FinanceKpiBundle {
  return {
    grossRevenue: 0,
    netRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    revenuePrev: 0,
    revenueChangePct: null,
    paidOrders: 0,
    unpaidOrders: 0,
    failedPayments: 0,
    refundedOrders: 0,
    partiallyRefundedOrders: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPaymentCount: 0,
    paymentVolume: 0,
    avgTransactionValue: 0,
    totalRefunded: 0,
    pendingRefunds: 0,
    completedRefunds: 0,
    failedRefunds: 0,
    pendingReceivables: 0,
    pendingSettlements: 0,
    openReconciliationIssues: 0,
  }
}

function parseDateInput(value: string | null | undefined): DateTime | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  const iso = DateTime.fromISO(raw, { zone: ZONE })
  if (iso.isValid) return iso
  const ymd = DateTime.fromFormat(raw, 'yyyy-MM-dd', { zone: ZONE })
  if (ymd.isValid) return ymd
  const slash = DateTime.fromFormat(raw, 'yyyy/MM/dd', { zone: ZONE })
  if (slash.isValid) return slash
  return null
}

function resolveRange(
  period: FinancePeriodId,
  customStart?: string | null,
  customEnd?: string | null,
): DateRange {
  const now = DateTime.now().setZone(ZONE)
  const todayStart = now.startOf('day')
  const todayEnd = now.endOf('day')

  let start: DateTime = todayStart
  let end: DateTime = todayEnd

  if (period === 'today') {
    start = todayStart
    end = todayEnd
  } else if (period === 'yesterday') {
    start = todayStart.minus({ days: 1 })
    end = todayStart.minus({ days: 1 }).endOf('day')
  } else if (period === 'last_7') {
    start = todayStart.minus({ days: 6 })
    end = todayEnd
  } else if (period === 'last_30') {
    start = todayStart.minus({ days: 29 })
    end = todayEnd
  } else if (period === 'this_month') {
    start = todayStart.startOf('month')
    end = todayEnd
  } else if (period === 'last_month') {
    const prev = todayStart.minus({ months: 1 })
    start = prev.startOf('month')
    end = prev.endOf('month')
  } else if (period === 'custom') {
    const cs = parseDateInput(customStart)
    const ce = parseDateInput(customEnd)
    const startMs = (cs?.isValid ? cs : todayStart).startOf('day').toMillis()
    const endMs = (ce?.isValid ? ce : todayEnd).endOf('day').toMillis()
    start = DateTime.fromMillis(Math.min(startMs, endMs), { zone: ZONE }).startOf('day')
    end = DateTime.fromMillis(Math.max(startMs, endMs), { zone: ZONE }).endOf('day')
  }

  const ms = end.toMillis() - start.toMillis()
  const previousEnd: DateTime = DateTime.fromMillis(start.toMillis() - 1, { zone: ZONE })
  const previousStart: DateTime = DateTime.fromMillis(previousEnd.toMillis() - ms, { zone: ZONE })

  return { start, end, previousStart, previousEnd }
}

function parseLooseDate(value: string | DateTime | null | undefined): DateTime | null {
  if (!value) return null
  if (DateTime.isDateTime(value)) return value.isValid ? value.setZone(ZONE) : null
  const raw = String(value).trim()
  if (!raw) return null
  const iso = DateTime.fromISO(raw, { zone: ZONE })
  if (iso.isValid) return iso
  const ymd = DateTime.fromFormat(raw.slice(0, 10), 'yyyy-MM-dd', { zone: ZONE })
  if (ymd.isValid) return ymd
  // dateKey yyyyMMdd
  if (/^\d{8}$/.test(raw)) {
    const dk = DateTime.fromFormat(raw, 'yyyyMMdd', { zone: ZONE })
    if (dk.isValid) return dk
  }
  return null
}

function inRange(value: string | null | undefined, start: DateTime, end: DateTime) {
  const d = parseLooseDate(value)
  if (!d) return false
  return d >= start && d <= end
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function isSuccessfulPayment(status: string) {
  return status === 'successful' || status === 'partially_refunded' || status === 'refunded'
}

function dayKey(d: DateTime) {
  return d.toFormat('yyyyMMdd')
}

function buildTrend(
  range: DateRange,
  orders: Array<{ date: string; dateKey?: string; total: number; status: string }>,
  payments: SellerPaymentRow[],
) {
  const days = Math.max(1, Math.ceil(range.end.diff(range.start, 'days').days) + 1)
  const useWeekday = days <= 7
  const labels: string[] = []
  const sales: number[] = []
  const paymentSeries: number[] = []

  const salesByKey = new Map<string, number>()
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'returned') continue
    const d = parseLooseDate(order.dateKey || order.date)
    if (!d || d < range.start || d > range.end) continue
    const key = dayKey(d)
    salesByKey.set(key, (salesByKey.get(key) ?? 0) + Math.round(Number(order.total) || 0))
  }

  const payByKey = new Map<string, number>()
  for (const pay of payments) {
    if (!isSuccessfulPayment(pay.status)) continue
    const d = parseLooseDate(pay.createdAt)
    if (!d || d < range.start || d > range.end) continue
    const key = dayKey(d)
    payByKey.set(key, (payByKey.get(key) ?? 0) + Math.round(Number(pay.amount) || 0))
  }

  const cursor = range.start.startOf('day')
  for (let i = 0; i < days; i++) {
    const day = cursor.plus({ days: i })
    if (day > range.end) break
    const key = dayKey(day)
    labels.push(useWeekday ? WEEKDAY_FA[day.weekday] ?? day.toFormat('MM/dd') : day.toFormat('MM/dd'))
    sales.push(salesByKey.get(key) ?? 0)
    paymentSeries.push(payByKey.get(key) ?? 0)
  }

  return { labels, sales, payments: paymentSeries }
}

export async function querySellerFinanceReports(filters: ReportsQuery) {
  const period = (filters.period || 'last_30') as FinancePeriodId
  const range = resolveRange(period, filters.start, filters.end)
  const todayR = resolveRange('today')
  const weekR = resolveRange('last_7')
  const monthR = resolveRange('this_month')

  const [ordersRaw, payments, refunds, payouts] = await Promise.all([
    SellerOrder.query().orderBy('date_key', 'desc').orderBy('id', 'desc').limit(500),
    buildSellerPayments(),
    SellerRefund.query().orderBy('created_at', 'desc').limit(500),
    SellerPayout.query().orderBy('created_at', 'desc').limit(200),
  ])

  const orders = await attachOrderListCommerce(ordersRaw)

  const successful = (list: SellerPaymentRow[]) => list.filter((p) => isSuccessfulPayment(p.status))

  const periodPayments = payments.filter((p) => inRange(p.createdAt, range.start, range.end))
  const prevPayments = payments.filter((p) =>
    inRange(p.createdAt, range.previousStart, range.previousEnd),
  )

  const gross = successful(periodPayments).reduce((s, p) => s + p.amount, 0)
  const periodRefunds = refunds.filter(
    (rf) => inRange(rf.createdAt?.toISO?.() || null, range.start, range.end) && rf.status === 'completed',
  )
  const refundSum = periodRefunds.reduce((s, rf) => s + (Number(rf.amount) || 0), 0)
  const net = Math.max(0, gross - refundSum)

  const prevGross = successful(prevPayments).reduce((s, p) => s + p.amount, 0)
  const prevRefund = refunds
    .filter(
      (rf) =>
        inRange(rf.createdAt?.toISO?.() || null, range.previousStart, range.previousEnd)
        && rf.status === 'completed',
    )
    .reduce((s, rf) => s + (Number(rf.amount) || 0), 0)
  const prevNet = Math.max(0, prevGross - prevRefund)

  const todayGross = successful(
    payments.filter((p) => inRange(p.createdAt, todayR.start, todayR.end)),
  ).reduce((s, p) => s + p.amount, 0)
  const weekGross = successful(
    payments.filter((p) => inRange(p.createdAt, weekR.start, weekR.end)),
  ).reduce((s, p) => s + p.amount, 0)
  const monthGross = successful(
    payments.filter((p) => inRange(p.createdAt, monthR.start, monthR.end)),
  ).reduce((s, p) => s + p.amount, 0)

  let paidOrders = 0
  let unpaidOrders = 0
  let failedPayments = 0
  let refundedOrders = 0
  let partiallyRefundedOrders = 0
  let orderDiscountTotal = 0

  for (const order of orders as any[]) {
    if (!inRange(order.date || order.dateKey, range.start, range.end)) continue
    const commerce = order.commerce || {}
    const ps = String(commerce.paymentStatus || '')
    if (ps === 'paid') paidOrders++
    else if (ps === 'pending') unpaidOrders++
    else if (ps === 'failed') failedPayments++
    else if (ps === 'refunded') refundedOrders++
    else if (ps === 'partially_refunded') partiallyRefundedOrders++
    orderDiscountTotal += Math.round(Number(commerce.discountAmount) || 0)
  }

  const succCount = successful(periodPayments).length
  const pendingPay = periodPayments.filter(
    (p) => p.status === 'pending' || p.status === 'processing',
  ).length
  const failedPay = periodPayments.filter((p) => p.status === 'failed').length
  const volume = successful(periodPayments).reduce((s, p) => s + p.amount, 0)

  const allPeriodRefunds = refunds.filter((rf) =>
    inRange(rf.createdAt?.toISO?.() || null, range.start, range.end),
  )
  const pendingRefunds = allPeriodRefunds.filter(
    (rf) => rf.status === 'pending' || rf.status === 'processing',
  ).length
  const completedRefunds = allPeriodRefunds.filter((rf) => rf.status === 'completed').length
  const failedRefunds = allPeriodRefunds.filter((rf) => rf.status === 'failed').length

  const pendingReceivables = payments
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((s, p) => s + p.amount, 0)

  const pendingSettlements = payouts
    .filter((p) => {
      const st = p.settlementStatus || (p.status === 'paid' ? 'completed' : 'pending')
      return st === 'pending' || st === 'processing'
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)

  const kpis: FinanceKpiBundle = {
    ...emptyKpis(),
    grossRevenue: Math.round(gross),
    netRevenue: Math.round(net),
    todayRevenue: Math.round(todayGross),
    weekRevenue: Math.round(weekGross),
    monthRevenue: Math.round(monthGross),
    revenuePrev: Math.round(prevNet),
    revenueChangePct: percentChange(net, prevNet),
    paidOrders,
    unpaidOrders,
    failedPayments,
    refundedOrders,
    partiallyRefundedOrders,
    successfulPayments: succCount,
    pendingPayments: pendingPay,
    failedPaymentCount: failedPay,
    paymentVolume: Math.round(volume),
    avgTransactionValue: succCount ? Math.round(volume / succCount) : 0,
    totalRefunded: Math.round(refundSum),
    pendingRefunds,
    completedRefunds,
    failedRefunds,
    pendingReceivables: Math.round(pendingReceivables),
    pendingSettlements: Math.round(pendingSettlements),
    openReconciliationIssues: 0,
  }

  const trend = buildTrend(
    range,
    orders.map((o: any) => ({
      date: String(o.date || ''),
      dateKey: String(o.dateKey || ''),
      total: Number(o.total) || 0,
      status: String(o.status || ''),
    })),
    payments,
  )

  return {
    period,
    range: {
      start: range.start.toISO(),
      end: range.end.toISO(),
      previousStart: range.previousStart.toISO(),
      previousEnd: range.previousEnd.toISO(),
    },
    kpis,
    discountImpact: {
      orderDiscountTotal: Math.round(orderDiscountTotal),
    },
    trend: {
      labels: trend.labels,
      sales: trend.sales,
      payments: trend.payments,
    },
    generatedAt: DateTime.now().setZone(ZONE).toISO(),
  }
}
