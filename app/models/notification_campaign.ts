import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type NotificationAudienceType = 'all' | 'group' | 'users'
export type NotificationAudienceGroup =
  | 'all_customers'
  | 'has_orders'
  | 'new_users'
  | 'inactive'

export type NotificationCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'cancelled'

export type NotificationCampaignType =
  | 'promotional'
  | 'order'
  | 'system'
  | 'inventory'
  | 'marketing'
  | 'announcement'

export default class NotificationCampaign extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'notification_campaigns'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare link: string | null

  @column()
  declare icon: string

  @column()
  declare type: NotificationCampaignType

  @column()
  declare audienceType: NotificationAudienceType

  @column()
  declare audienceGroup: NotificationAudienceGroup | null

  @column({
    prepare: (value: number[]) => JSON.stringify(value ?? []),
    consume: (value: number[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : value ?? [],
  })
  declare userIds: number[]

  @column()
  declare recipientCount: number

  @column()
  declare status: NotificationCampaignStatus

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column()
  declare image: string | null

  @column({
    prepare: (value: { type: string; id: string } | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: unknown) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }
      return value as { type: string; id: string }
    },
  })
  declare relatedEntity: { type: string; id: string } | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      link: this.link ?? null,
      icon: this.icon,
      type: this.type || 'announcement',
      audienceType: this.audienceType,
      audienceGroup: this.audienceGroup ?? null,
      userIds: this.userIds ?? [],
      recipientCount: this.recipientCount,
      status: this.status,
      scheduledAt: this.scheduledAt?.toISO() ?? null,
      image: this.image ?? null,
      relatedEntity: this.relatedEntity ?? null,
      createdAt: this.createdAt?.toISO() ?? null,
      sentAt: this.sentAt?.toISO() ?? null,
    }
  }
}
