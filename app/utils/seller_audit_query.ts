import AuditLog from '#models/audit_log'
import type { AuditQuery } from '#validators/audit'
import { pageWindow, parseListQs } from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

type AuditQ = ModelQueryBuilderContract<typeof AuditLog, AuditLog>

export function parseAuditListQs(qs: Record<string, any>) {
  const next = parseListQs(qs)
  if (next.action === 'all' || next.action === '') delete next.action
  if (next.entity === 'all' || next.entity === '') delete next.entity
  if (next.actorId === 'all' || next.actorId === '') delete next.actorId
  if (next.mode === '') delete next.mode
  if (next.dateFrom === '') delete next.dateFrom
  if (next.dateTo === '') delete next.dateTo
  return next
}

function applyAuditFilters(query: AuditQ, filters: AuditQuery) {
  let q = query

  if (filters.mode === 'activity') {
    q = q.whereNot('action', 'login')
  }

  if (filters.action && filters.action !== 'all') {
    q = q.where('action', filters.action)
  }
  if (filters.entity && filters.entity !== 'all') {
    q = q.where('entity', filters.entity)
  }
  if (filters.actorId) {
    const id = Number(filters.actorId)
    if (Number.isFinite(id) && id > 0) {
      q = q.where('actor_id', id)
    }
  }

  if (filters.dateFrom) {
    const from = DateTime.fromISO(filters.dateFrom, { zone: 'utc' }).startOf('day')
    if (from.isValid) q = q.where('created_at', '>=', from.toSQL()!)
  }
  if (filters.dateTo) {
    const to = DateTime.fromISO(filters.dateTo, { zone: 'utc' }).endOf('day')
    if (to.isValid) q = q.where('created_at', '<=', to.toSQL()!)
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('summary', like)
        .orWhereILike('actor_name', like)
        .orWhereILike('entity_id', like)
        .orWhereILike('action', like)
        .orWhereILike('entity', like)
    })
  }

  return q
}

async function actionBuckets(filters: AuditQuery) {
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const base = () => applyAuditFilters(AuditLog.query(), { ...filters, action: undefined })
  const [allRow, createRow, updateRow, deleteRow, statusRow, loginRow, permRow, otherRow] =
    await Promise.all([
      base().count('* as total').first(),
      base().where('action', 'create').count('* as total').first(),
      base().where('action', 'update').count('* as total').first(),
      base().where('action', 'delete').count('* as total').first(),
      base().where('action', 'status_change').count('* as total').first(),
      base().where('action', 'login').count('* as total').first(),
      base().where('action', 'permission_change').count('* as total').first(),
      base().where('action', 'other').count('* as total').first(),
    ])
  return {
    all: num(allRow),
    create: num(createRow),
    update: num(updateRow),
    delete: num(deleteRow),
    status_change: num(statusRow),
    login: num(loginRow),
    permission_change: num(permRow),
    other: num(otherRow),
  }
}

async function distinctActors(limit = 40) {
  try {
    const rows = await db
      .from('audit_logs')
      .select('actor_id', 'actor_name')
      .whereNotNull('actor_name')
      .where('actor_name', '!=', '')
      .groupBy('actor_id', 'actor_name')
      .orderBy('actor_name', 'asc')
      .limit(limit)
    return (rows || []).map((row: any) => ({
      id: row.actor_id != null ? String(row.actor_id) : '',
      name: String(row.actor_name || ''),
    }))
  } catch {
    return []
  }
}

export async function querySellerAudit(filters: AuditQuery) {
  const { wantAll, page, pageSize } = pageWindow({
    ...filters,
    pageSize: filters.pageSize ?? 12,
  })

  const countRow = await applyAuditFilters(AuditLog.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const ordered = applyAuditFilters(AuditLog.query(), filters).orderBy('created_at', 'desc')

  const rows = wantAll
    ? await ordered.limit(pageSize)
    : await ordered.offset((page - 1) * pageSize).limit(pageSize)

  const [statusCounts, actors] = await Promise.all([
    actionBuckets(filters),
    distinctActors(),
  ])

  return {
    items: rows.map((r) => r.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? rows.length : pageSize,
    statusCounts,
    actors,
  }
}
