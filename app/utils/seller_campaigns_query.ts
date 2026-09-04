import StoreCampaign from '#models/store_campaign'
import type { CampaignsQuery } from '#validators/campaign'
import { DateTime } from 'luxon'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type CampaignQuery = ModelQueryBuilderContract<typeof StoreCampaign, StoreCampaign>

function applyLifecycleStatus(query: CampaignQuery, status: string, now: DateTime) {
  const nowSql = now.toSQL()!
  if (status === 'draft' || status === 'paused' || status === 'archived') {
    return query.where('manual_status', status)
  }
  if (status === 'active') {
    return query
      .where('manual_status', 'active')
      .where('starts_at', '<=', nowSql)
      .where('ends_at', '>', nowSql)
  }
  if (status === 'scheduled') {
    return query.where('manual_status', 'active').where('starts_at', '>', nowSql)
  }
  if (status === 'expired') {
    return query.where('manual_status', 'active').where('ends_at', '<=', nowSql)
  }
  return query
}

function applyFilters(
  query: CampaignQuery,
  filters: CampaignsQuery,
  options?: { includeStatus?: boolean }
) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const now = DateTime.utc()

  if (includeStatus && filters.status && filters.status !== 'all') {
    q = applyLifecycleStatus(q, filters.status, now)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('name', like)
        .orWhereILike('slug', like)
        .orWhereILike('description', like)
    })
  }

  return q
}

async function statusCounts(filters: CampaignsQuery) {
  const nowSql = DateTime.utc().toSQL()!
  const base = () => applyFilters(StoreCampaign.query(), filters, { includeStatus: false })
  const [allRow, activeRow, draftRow, pausedRow, archivedRow, scheduledRow, expiredRow] =
    await Promise.all([
      base().count('* as total').first(),
      base()
        .where('manual_status', 'active')
        .where('starts_at', '<=', nowSql)
        .where('ends_at', '>', nowSql)
        .count('* as total')
        .first(),
      base().where('manual_status', 'draft').count('* as total').first(),
      base().where('manual_status', 'paused').count('* as total').first(),
      base().where('manual_status', 'archived').count('* as total').first(),
      base()
        .where('manual_status', 'active')
        .where('starts_at', '>', nowSql)
        .count('* as total')
        .first(),
      base()
        .where('manual_status', 'active')
        .where('ends_at', '<=', nowSql)
        .count('* as total')
        .first(),
    ])

  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    active: num(activeRow),
    draft: num(draftRow),
    paused: num(pausedRow),
    archived: num(archivedRow),
    scheduled: num(scheduledRow),
    expired: num(expiredRow),
  }
}

export async function querySellerCampaigns(filters: CampaignsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(StoreCampaign.query(), filters)
    .orderBy('priority', 'asc')
    .orderBy('created_at', 'desc')

  const countRow = await applyFilters(StoreCampaign.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((row) => row.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}
