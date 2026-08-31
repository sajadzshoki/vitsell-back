import Notification from '#models/notification'
import NotificationCampaign from '#models/notification_campaign'
import type {
  NotificationAudienceGroup,
  NotificationAudienceType,
} from '#models/notification_campaign'
import { listNotificationUsers, resolveAudienceUserIds } from '#utils/notification_audience'
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

const storeValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(120),
    description: vine.string().trim().minLength(1).maxLength(1000),
    link: vine.string().trim().nullable().optional(),
    icon: vine.string().trim().minLength(1).maxLength(80),
    ...audienceFields,
  })
)

function createCampaignId() {
  return `ntf-${Date.now().toString(36)}`
}

export default class SellerNotificationsController {
  async index({ response }: HttpContext) {
    const campaigns = await NotificationCampaign.query().orderBy('created_at', 'desc')
    return response.ok(campaigns.map((c) => c.toAdminJSON()))
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

    const campaign = await db.transaction(async (trx) => {
      const row = await NotificationCampaign.create(
        {
          id: campaignId,
          title: payload.title.trim(),
          description: payload.description.trim(),
          link,
          icon,
          audienceType,
          audienceGroup,
          userIds: audienceType === 'users' ? selectedUserIds.map(Number) : [],
          recipientCount: recipientIds.length,
          status: 'sent',
          sentAt: now,
        },
        { client: trx }
      )

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

      return row
    })

    return response.created(campaign.toAdminJSON())
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
