import Notification from '#models/notification'
import NotificationCampaign from '#models/notification_campaign'
import type {
  NotificationAudienceGroup,
  NotificationAudienceType,
} from '#models/notification_campaign'
import { listNotificationUsers, resolveAudienceUserIds } from '#utils/notification_audience'
import { notificationsQueryValidator } from '#validators/notifications_query'
import { querySellerNotifications } from '#utils/seller_notifications_query'
import { parseListQs } from '#utils/seller_schedule_filters'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

const audienceTypeEnum = ['all', 'group', 'users'] as const
const audienceGroupEnum = ['all_customers', 'has_orders', 'new_users', 'inactive'] as const

const audienceFields = {
  audienceType: vine.enum(audienceTypeEnum),
  audienceGroup: vine.enum(audienceGroupEnum).nullable().optional(),
  userIds: vine.array(vine.number()).optional(),
}

const previewValidator = vine.compile(vine.object(audienceFields))

const typeEnum = [
  'promotional',
  'order',
  'system',
  'inventory',
  'marketing',
  'announcement',
] as const

const storeValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(120),
    description: vine.string().trim().minLength(1).maxLength(1000),
    link: vine.string().trim().nullable().optional(),
    icon: vine.string().trim().minLength(1).maxLength(80),
    type: vine.enum(typeEnum).optional(),
    scheduledAt: vine.string().trim().nullable().optional(),
    image: vine.string().trim().nullable().optional(),
    relatedEntity: vine
      .object({
        type: vine.string().trim(),
        id: vine.string().trim(),
      })
      .nullable()
      .optional(),
    ...audienceFields,
  })
)

function createCampaignId() {
  return `ntf-${Date.now().toString(36)}`
}

export default class SellerNotificationsController {
  async index({ request, response }: HttpContext) {
    const qs = parseListQs({ ...request.qs() })
    if (qs.type === 'all' || qs.type === '') delete qs.type
    const filters = await notificationsQueryValidator.validate(qs)
    return response.ok(await querySellerNotifications(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await NotificationCampaign.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'اعلان یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async users({ response }: HttpContext) {
    return response.ok(await listNotificationUsers())
  }

  async preview({ request, response }: HttpContext) {
    const payload = await request.validateUsing(previewValidator)
    const ids = await resolveAudienceUserIds(
      payload.audienceType as NotificationAudienceType,
      (payload.audienceGroup ?? null) as NotificationAudienceGroup | null,
      payload.userIds ?? []
    )
    return response.ok({ count: ids.length })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const audienceType = payload.audienceType as NotificationAudienceType
    const audienceGroup =
      audienceType === 'group'
        ? ((payload.audienceGroup ?? 'all_customers') as NotificationAudienceGroup)
        : null
    const selectedUserIds = payload.userIds ?? []

    if (audienceType === 'users' && !selectedUserIds.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'userIds', message: 'حداقل یک کاربر انتخاب کنید' }],
      })
    }

    const recipientIds = await resolveAudienceUserIds(
      audienceType,
      audienceGroup,
      selectedUserIds
    )
    if (!recipientIds.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'audienceType', message: 'مخاطبی برای ارسال پیدا نشد' }],
      })
    }

    const now = DateTime.utc()
    const link = (payload.link ?? '').toString().trim() || null
    const icon = payload.icon.trim() || 'i-tabler-bell'
    const campaignId = createCampaignId()
    const scheduledRaw = payload.scheduledAt?.toString().trim()
    const scheduledAt = scheduledRaw
      ? DateTime.fromISO(scheduledRaw, { setZone: true })
      : null
    const isScheduled =
      scheduledAt?.isValid && scheduledAt.toUTC() > now

    const campaign = await db.transaction(async (trx) => {
      const row = await NotificationCampaign.create(
        {
          id: campaignId,
          title: payload.title.trim(),
          description: payload.description.trim(),
          link,
          icon,
          type: payload.type ?? 'announcement',
          audienceType,
          audienceGroup,
          userIds: audienceType === 'users' ? selectedUserIds.map(Number) : [],
          recipientCount: isScheduled ? recipientIds.length : recipientIds.length,
          status: isScheduled ? 'scheduled' : 'sent',
          scheduledAt: isScheduled ? scheduledAt!.toUTC() : null,
          image: payload.image?.toString().trim() || null,
          relatedEntity: payload.relatedEntity ?? null,
          sentAt: isScheduled ? null : now,
        },
        { client: trx }
      )

      if (!isScheduled) {
        const stamp = Date.now()
        const notifications = recipientIds.map((userId, index) => ({
          id: `${campaignId}-${userId}-${stamp + index}`,
          userId,
          title: row.title,
          description: row.description,
          time: 'همین الان',
          icon: row.icon,
          read: false,
          to: row.link,
          campaignId: row.id,
        }))
        await Notification.createMany(notifications, { client: trx })
      }

      return row
    })

    return response.created(campaign.toAdminJSON())
  }

  async cancel({ params, response }: HttpContext) {
    const campaign = await NotificationCampaign.find(params.id)
    if (!campaign) {
      return response.notFound({ errors: [{ field: 'id', message: 'اعلان یافت نشد' }] })
    }
    if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
      return response.unprocessableEntity({
        errors: [{ field: 'status', message: 'فقط اعلان‌های زمان‌بندی‌شده یا پیش‌نویس قابل لغو هستند' }],
      })
    }
    campaign.status = 'cancelled'
    await campaign.save()
    return response.ok(campaign.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const campaign = await NotificationCampaign.find(params.id)
    if (!campaign) {
      return response.notFound({ errors: [{ field: 'id', message: 'اعلان یافت نشد' }] })
    }
    // notifications cascade via FK
    await campaign.delete()
    return response.ok({ message: 'اعلان حذف شد' })
  }
}
