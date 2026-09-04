import { DateTime } from 'luxon'

/** Schedule statuses used by banners / deals / discount-codes admin lists. */
export const scheduleListStatuses = [
  'all',
  'active',
  'scheduled',
  'paused',
  'expired',
] as const

export type ScheduleListStatus = (typeof scheduleListStatuses)[number]

/**
 * Match FE `deriveScheduleStatus({ active, startsAt, endsAt })` for list filters.
 * - active: live window + active
 * - scheduled: future start + active
 * - paused: inactive and not past end
 * - expired: past end + still flagged active (FE "expired"; inactive past is "ended" and only in "all")
 */
export function applyActiveScheduleStatus(
  query: any,
  status: string | undefined,
  opts?: { activeCol?: string; startsCol?: string; endsCol?: string; now?: DateTime }
) {
  if (!status || status === 'all') return query
  const activeCol = opts?.activeCol ?? 'active'
  const startsCol = opts?.startsCol ?? 'starts_at'
  const endsCol = opts?.endsCol ?? 'ends_at'
  const nowSql = (opts?.now ?? DateTime.utc()).toSQL()!

  if (status === 'active') {
    return query
      .where(activeCol, true)
      .where((q: any) => {
        q.whereNull(startsCol).orWhere(startsCol, '<=', nowSql)
      })
      .where((q: any) => {
        q.whereNull(endsCol).orWhere(endsCol, '>', nowSql)
      })
  }
  if (status === 'scheduled') {
    return query.where(activeCol, true).whereNotNull(startsCol).where(startsCol, '>', nowSql)
  }
  if (status === 'paused') {
    return query.where(activeCol, false).where((q: any) => {
      q.whereNull(endsCol).orWhere(endsCol, '>', nowSql)
    })
  }
  if (status === 'expired') {
    return query.where(activeCol, true).whereNotNull(endsCol).where(endsCol, '<=', nowSql)
  }
  return query
}

export async function countActiveScheduleBuckets(
  baseFactory: () => any,
  opts?: { activeCol?: string; startsCol?: string; endsCol?: string }
) {
  const activeCol = opts?.activeCol ?? 'active'
  const startsCol = opts?.startsCol ?? 'starts_at'
  const endsCol = opts?.endsCol ?? 'ends_at'
  const nowSql = DateTime.utc().toSQL()!
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)

  const [allRow, activeRow, scheduledRow, pausedRow, expiredRow] = await Promise.all([
    baseFactory().count('* as total').first(),
    applyActiveScheduleStatus(baseFactory(), 'active', { activeCol, startsCol, endsCol }).count('* as total').first(),
    applyActiveScheduleStatus(baseFactory(), 'scheduled', { activeCol, startsCol, endsCol }).count('* as total').first(),
    applyActiveScheduleStatus(baseFactory(), 'paused', { activeCol, startsCol, endsCol }).count('* as total').first(),
    applyActiveScheduleStatus(baseFactory(), 'expired', { activeCol, startsCol, endsCol }).count('* as total').first(),
  ])

  return {
    all: num(allRow),
    active: num(activeRow),
    scheduled: num(scheduledRow),
    paused: num(pausedRow),
    expired: num(expiredRow),
  }
}

export function parseListQs(qs: Record<string, any>) {
  const next = { ...qs }
  if (next.status === 'all' || next.status === '') delete next.status
  if (next.placement === 'all' || next.placement === '') delete next.placement
  if (next.type === 'all' || next.type === '') delete next.type
  if (next.category === 'all' || next.category === '') delete next.category
  if (next.author === 'all' || next.author === '') delete next.author
  if (next.q === '') delete next.q
  for (const key of ['page', 'pageSize'] as const) {
    if (next[key] === '' || next[key] == null) delete next[key]
    else if (next[key] != null) next[key] = Number(next[key])
  }
  if (next.all === '1' || next.all === 'true') next.all = true
  else if (next.all === '0' || next.all === 'false' || next.all === '') delete next.all
  if (next.featured === '1' || next.featured === 'true') next.featured = true
  else if (next.featured === '0' || next.featured === 'false' || next.featured === '') delete next.featured
  return next
}

export function pageWindow(filters: { page?: number; pageSize?: number; all?: boolean }) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))
  return { wantAll, page, pageSize }
}
