import User from '#models/user'
import Order from '#models/order'
import type {
  NotificationAudienceGroup,
  NotificationAudienceType,
} from '#models/notification_campaign'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/** Resolve customer user ids for a broadcast audience. */
export async function resolveAudienceUserIds(
  audienceType: NotificationAudienceType,
  audienceGroup: NotificationAudienceGroup | null | undefined,
  userIds: number[] = []
): Promise<number[]> {
  if (audienceType === 'users') {
    const unique = [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    if (!unique.length) return []
    const rows = await User.query().whereIn('id', unique).where('role', 'customer')
    return rows.map((u) => u.id)
  }

  if (audienceType === 'all' || audienceGroup === 'all_customers' || !audienceGroup) {
    const rows = await User.query().where('role', 'customer').select('id')
    return rows.map((u) => u.id)
  }

  if (audienceGroup === 'has_orders') {
    const rows = await db
      .from('orders')
      .distinct('user_id')
      .whereIn('user_id', db.from('users').select('id').where('role', 'customer'))
    return rows.map((r: { user_id: number }) => Number(r.user_id))
  }

  if (audienceGroup === 'new_users') {
    const since = DateTime.utc().minus({ days: 30 }).toSQL()
    const rows = await User.query()
      .where('role', 'customer')
      .where('created_at', '>=', since!)
      .select('id')
    return rows.map((u) => u.id)
  }

  // inactive: customers with no orders in the last 90 days (includes never ordered)
  const since = DateTime.utc().minus({ days: 90 }).toSQL()
  const recentBuyerIds = await Order.query()
    .where('created_at', '>=', since!)
    .distinct('user_id')
    .select('user_id')
  const recentSet = new Set(recentBuyerIds.map((r) => Number(r.userId)))
  const customers = await User.query().where('role', 'customer').select('id')
  return customers.map((u) => u.id).filter((id) => !recentSet.has(id))
}

export async function listNotificationUsers() {
  const users = await User.query()
    .where('role', 'customer')
    .preload('profile')
    .orderBy('id', 'asc')
    .limit(500)

  const orderUserIds = new Set(
    (
      await db.from('orders').distinct('user_id').select('user_id')
    ).map((r: { user_id: number }) => Number(r.user_id))
  )

  const thirtyDaysAgo = DateTime.utc().minus({ days: 30 })
  const ninetyDaysAgo = DateTime.utc().minus({ days: 90 })
  const recentBuyerIds = new Set(
    (
      await Order.query()
        .where('created_at', '>=', ninetyDaysAgo.toSQL()!)
        .distinct('user_id')
        .select('user_id')
    ).map((r) => Number(r.userId))
  )

  return users.map((user) => {
    const first = user.profile?.firstName?.trim() || ''
    const last = user.profile?.lastName?.trim() || ''
    const name = `${first} ${last}`.trim() || user.phone
    const groupHints: NotificationAudienceGroup[] = ['all_customers']
    if (orderUserIds.has(user.id)) groupHints.push('has_orders')
    if (user.createdAt >= thirtyDaysAgo) groupHints.push('new_users')
    if (!recentBuyerIds.has(user.id)) groupHints.push('inactive')
    return {
      id: user.id,
      name,
      phone: user.phone,
      groupHints,
    }
  })
}
