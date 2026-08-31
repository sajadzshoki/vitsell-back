import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** DB `percent` is a ratio (0.1 = 10%). Admin JSON exposes integer 1–99. */
export default class DiscountCode extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'discount_codes'

  @column({ isPrimary: true })
  declare code: string

  @column()
  declare percent: number

  @column()
  declare active: boolean

  @column.dateTime()
  declare startsAt: DateTime | null

  @column.dateTime()
  declare endsAt: DateTime | null

  @column()
  declare minAmount: number

  @column()
  declare oncePerUser: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /** Integer percent for admin / seller UI (1–99). */
  get percentInt() {
    return Math.min(99, Math.max(1, Math.round(Number(this.percent) * 100)))
  }

  static ratioFromInt(percent: number) {
    const clamped = Math.min(99, Math.max(1, Math.round(percent)))
    return clamped / 100
  }

  isLive(now = DateTime.utc()) {
    if (!this.active) return false
    if (this.startsAt && this.startsAt > now) return false
    if (this.endsAt && this.endsAt < now) return false
    return true
  }

  meetsMinAmount(subtotal: number) {
    return subtotal >= Number(this.minAmount || 0)
  }

  toAdminJSON() {
    return {
      code: this.code,
      percent: this.percentInt,
      active: this.active,
      startsAt: this.startsAt?.toISO() ?? null,
      endsAt: this.endsAt?.toISO() ?? null,
      minAmount: Number(this.minAmount || 0),
      oncePerUser: Boolean(this.oncePerUser),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
