import NotificationCampaign from '#models/notification_campaign'
import type { NotificationsQuery } from '#validators/notifications_query'
import { pageWindow } from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type NotifQuery = ModelQueryBuilderContract<typeof NotificationCampaign, NotificationCampaign>

function applyFilters(query: NotifQuery, filters: NotificationsQuery, options?: { includeStatus?: boolean; includeType?: boolean }) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const includeType = options?.includeType !== false
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  if (includeType && filters.type && filters.type !== 'all') {
    q = q.where('type', filters.type)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('title', like)
        .orWhereILike('description', like)
        .orWhereILike('link', like)
    })
  }
  return q
}

async function statusCounts(filters: NotificationsQuery) {
  const base = () => applyFilters(NotificationCampaign.query(), filters, { includeStatus: false })
  const statuses = ['draft', 'scheduled', 'sent', 'failed', 'cancelled'] as const
  const rows = await Promise.all([
    base().count('* as total').first(),
    ...statuses.map((s) => base().where('status', s).count('* as total').first()),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(rows[0]),
    draft: num(rows[1]),
    scheduled: num(rows[2]),
    sent: num(rows[3]),
    failed: num(rows[4]),
    cancelled: num(rows[5]),
  }
}

export async function querySellerNotifications(filters: NotificationsQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(NotificationCampaign.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(NotificationCampaign.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((c) => c.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}
