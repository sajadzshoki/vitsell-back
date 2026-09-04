import AmazingDeal from '#models/amazing_deal'
import Banner from '#models/banner'
import ContentPromo from '#models/content_promo'
import DiscountCode from '#models/discount_code'
import NotificationCampaign from '#models/notification_campaign'
import StoreCampaign from '#models/store_campaign'
import StoreDiscount from '#models/store_discount'
import type { MarketingSummaryQuery } from '#validators/marketing'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

type CountBucket = { total: number; active: number; localOnly?: boolean }

function parseBound(value: string | undefined, endOfDay: boolean) {
  if (!value?.trim()) return null
  let dt = DateTime.fromISO(value.trim(), { setZone: true })
  if (!dt.isValid) {
    dt = DateTime.fromSQL(value.trim(), { setZone: true })
  }
  if (!dt.isValid) return null
  if (endOfDay) return dt.endOf('day').toUTC()
  return dt.startOf('day').toUTC()
}

function applyScheduleOverlap(
  query: any,
  from: DateTime | null,
  to: DateTime | null,
  startsCol = 'starts_at',
  endsCol = 'ends_at'
) {
  if (!from && !to) return query
  if (to) {
    query = query.where((q: any) => {
      q.whereNull(startsCol).orWhere(startsCol, '<=', to.toSQL())
    })
  }
  if (from) {
    query = query.where((q: any) => {
      q.whereNull(endsCol).orWhere(endsCol, '>=', from.toSQL())
    })
  }
  return query
}

function applyCreatedOverlap(
  query: any,
  from: DateTime | null,
  to: DateTime | null,
  col = 'created_at'
) {
  if (from) query = query.where(col, '>=', from.toSQL())
  if (to) query = query.where(col, '<=', to.toSQL())
  return query
}

async function countRows(query: any): Promise<number> {
  const row = await query.count('* as total').first()
  return Number(row?.$extras?.total ?? row?.total ?? 0)
}

async function bucketScheduled(
  Model: typeof Banner | typeof AmazingDeal | typeof DiscountCode | typeof StoreDiscount,
  from: DateTime | null,
  to: DateTime | null,
  activeWhere: Record<string, any> = { active: true }
): Promise<CountBucket> {
  const base = () => applyScheduleOverlap(Model.query(), from, to)
  const [total, active] = await Promise.all([
    countRows(base()),
    countRows(base().where(activeWhere)),
  ])
  return { total, active }
}

function inScheduleRange(
  startsAt: DateTime | null,
  endsAt: DateTime | null,
  from: DateTime | null,
  to: DateTime | null
) {
  if (!from && !to) return true
  const fromMs = from?.toMillis() ?? Number.NEGATIVE_INFINITY
  const toMs = to?.toMillis() ?? Number.POSITIVE_INFINITY
  const s = startsAt?.toMillis() ?? Number.NEGATIVE_INFINITY
  const e = endsAt?.toMillis() ?? Number.POSITIVE_INFINITY
  return s <= toMs && fromMs <= e
}

export async function queryMarketingSummary(filters: MarketingSummaryQuery) {
  const from = parseBound(filters.from, false)
  const to = parseBound(filters.to, true)
  const nowSql = DateTime.utc().toSQL()!

  const [discounts, campaigns, banners, deals, coupons, promos] = await Promise.all([
    bucketScheduled(StoreDiscount, from, to, { status: 'active' }),
    (async (): Promise<CountBucket> => {
      const base = () => applyScheduleOverlap(StoreCampaign.query(), from, to)
      const [total, active] = await Promise.all([
        countRows(base()),
        countRows(
          base()
            .where('manual_status', 'active')
            .where('starts_at', '<=', nowSql)
            .where('ends_at', '>', nowSql)
        ),
      ])
      return { total, active }
    })(),
    bucketScheduled(Banner, from, to),
    bucketScheduled(AmazingDeal, from, to),
    bucketScheduled(DiscountCode, from, to),
    (async (): Promise<CountBucket> => {
      const base = () => applyCreatedOverlap(ContentPromo.query(), from, to)
      const [total, active] = await Promise.all([
        countRows(base()),
        countRows(base().where('active', true)),
      ])
      return { total, active }
    })(),
  ])

  let notificationsQuery = NotificationCampaign.query()
  if (from || to) {
    const fromSql = from?.toSQL()
    const toSql = to?.toSQL()
    notificationsQuery = notificationsQuery.where((builder) => {
      builder
        .where((b) => {
          if (fromSql) b.where('created_at', '>=', fromSql)
          if (toSql) b.where('created_at', '<=', toSql)
        })
        .orWhere((b) => {
          if (fromSql) b.whereNotNull('scheduled_at').where('scheduled_at', '>=', fromSql)
          if (toSql) b.whereNotNull('scheduled_at').where('scheduled_at', '<=', toSql)
        })
        .orWhere((b) => {
          if (fromSql) b.whereNotNull('sent_at').where('sent_at', '>=', fromSql)
          if (toSql) b.whereNotNull('sent_at').where('sent_at', '<=', toSql)
        })
    })
  }
  const notificationsTotal = await countRows(notificationsQuery)

  let usageQuery = db
    .from('orders')
    .whereNotNull('discount_code')
    .where('discount_code', '!=', '')
  if (from) usageQuery = usageQuery.where('created_at', '>=', from.toSQL()!)
  if (to) usageQuery = usageQuery.where('created_at', '<=', to.toSQL()!)

  const usageRows = await usageQuery
    .select('discount_code')
    .count('* as usage_count')
    .sum('discount_amount as total_discount')
    .groupBy('discount_code')
    .orderBy('usage_count', 'desc')
    .limit(20)

  const codes = await DiscountCode.query().orderBy('created_at', 'desc')
  const codeMeta = new Map(codes.map((c) => [c.code.toUpperCase(), c]))

  const topCoupons = usageRows.map((row: any) => {
    const code = String(row.discount_code || '').toUpperCase()
    const meta = codeMeta.get(code)
    return {
      code,
      usageCount: Number(row.usage_count ?? 0),
      totalDiscountAmount: Number(row.total_discount ?? 0),
      active: meta ? Boolean(meta.active) : false,
      startsAt: meta?.startsAt?.toISO() ?? null,
      endsAt: meta?.endsAt?.toISO() ?? null,
    }
  })

  const usedSet = new Set(topCoupons.map((c) => c.code))
  for (const c of codes) {
    const key = c.code.toUpperCase()
    if (usedSet.has(key)) continue
    if (!inScheduleRange(c.startsAt, c.endsAt, from, to)) continue
    topCoupons.push({
      code: key,
      usageCount: 0,
      totalDiscountAmount: 0,
      active: Boolean(c.active),
      startsAt: c.startsAt?.toISO() ?? null,
      endsAt: c.endsAt?.toISO() ?? null,
    })
  }

  topCoupons.sort((a, b) => b.usageCount - a.usageCount || a.code.localeCompare(b.code))

  return {
    range: {
      from: from?.toISO() ?? null,
      to: to?.toISO() ?? null,
    },
    kpis: {
      discounts,
      campaigns,
      banners,
      deals,
      coupons,
      promos,
      notifications: { total: notificationsTotal, active: 0 },
    },
    coupons: {
      usageTotal: topCoupons.reduce((s, c) => s + c.usageCount, 0),
      discountTotal: topCoupons.reduce((s, c) => s + c.totalDiscountAmount, 0),
      top: topCoupons.slice(0, 8),
    },
  }
}
