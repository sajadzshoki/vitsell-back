import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ContentPromo extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'content_promos'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eyebrow: string

  @column()
  declare title: string

  @column()
  declare subtitle: string

  @column()
  declare tone: string

  @column()
  declare icon: string

  @column()
  declare primaryCtaLabel: string

  @column()
  declare primaryCtaTo: string | null

  @column()
  declare secondaryCtaLabel: string | null

  @column()
  declare secondaryCtaTo: string | null

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      eyebrow: this.eyebrow ?? '',
      title: this.title,
      subtitle: this.subtitle,
      tone: this.tone === 'warning' ? 'warning' : 'primary',
      icon: this.icon || 'sparkles',
      primaryCtaLabel: this.primaryCtaLabel,
      primaryCtaTo: this.primaryCtaTo ?? '',
      secondaryCtaLabel: this.secondaryCtaLabel ?? '',
      secondaryCtaTo: this.secondaryCtaTo ?? '',
      active: this.active,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }

  /** Shape expected by storefront HomePromo */
  toPublicJSON() {
    const primaryCta: { label: string; to?: string } = {
      label: this.primaryCtaLabel,
    }
    if (this.primaryCtaTo) primaryCta.to = this.primaryCtaTo

    const result: {
      id: string
      eyebrow: string
      title: string
      subtitle: string
      tone: 'primary' | 'warning'
      icon: string
      primaryCta: { label: string; to?: string }
      secondaryCta?: { label: string; to?: string }
    } = {
      id: this.id,
      eyebrow: this.eyebrow ?? '',
      title: this.title,
      subtitle: this.subtitle,
      tone: this.tone === 'warning' ? 'warning' : 'primary',
      icon: this.icon || 'sparkles',
      primaryCta,
    }

    if (this.secondaryCtaLabel) {
      result.secondaryCta = {
        label: this.secondaryCtaLabel,
        ...(this.secondaryCtaTo ? { to: this.secondaryCtaTo } : {}),
      }
    }

    return result
  }
}
