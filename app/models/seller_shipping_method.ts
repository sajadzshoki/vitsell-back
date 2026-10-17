import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import SellerShippingMethodCity from '#models/seller_shipping_method_city'
import SellerShippingWeekdaySlot from '#models/seller_shipping_weekday_slot'
import SellerShippingHolidaySlot from '#models/seller_shipping_holiday_slot'
import SellerShippingDayOverride from '#models/seller_shipping_day_override'

export type SellerShippingMethodStatus = 'active' | 'inactive'
export type SellerShippingCoverage = 'nationwide' | 'cities'
export type SellerShippingHolidayMode = 'use_weekday' | 'custom' | 'closed'

export default class SellerShippingMethod extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_shipping_methods'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare carrier: string

  @column()
  declare estimatedDays: string

  @column()
  declare baseCost: number

  @column()
  declare status: SellerShippingMethodStatus

  @column()
  declare sortOrder: number

  @column()
  declare coverage: SellerShippingCoverage

  @column()
  declare slotsEnabled: boolean

  @column()
  declare holidayMode: SellerShippingHolidayMode

  @column()
  declare expressEnabled: boolean

  @column()
  declare expressPrice: number

  @column()
  declare expressDeadlineHour: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => SellerShippingMethodCity, { foreignKey: 'methodId' })
  declare cities: HasMany<typeof SellerShippingMethodCity>

  @hasMany(() => SellerShippingWeekdaySlot, { foreignKey: 'methodId' })
  declare weekdaySlots: HasMany<typeof SellerShippingWeekdaySlot>

  @hasMany(() => SellerShippingHolidaySlot, { foreignKey: 'methodId' })
  declare holidaySlots: HasMany<typeof SellerShippingHolidaySlot>

  @hasMany(() => SellerShippingDayOverride, { foreignKey: 'methodId' })
  declare dayOverrides: HasMany<typeof SellerShippingDayOverride>

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      carrier: this.carrier ?? '',
      estimatedDays: this.estimatedDays ?? '',
      baseCost: Number(this.baseCost) || 0,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Number(this.sortOrder) || 0,
      coverage: this.coverage === 'cities' ? 'cities' : 'nationwide',
      slotsEnabled: Boolean(this.slotsEnabled),
      holidayMode:
        this.holidayMode === 'custom' || this.holidayMode === 'closed'
          ? this.holidayMode
          : 'use_weekday',
      expressEnabled: Boolean(this.expressEnabled),
      expressPrice: Number(this.expressPrice) || 0,
      expressDeadlineHour: Math.min(23, Math.max(0, Number(this.expressDeadlineHour) || 12)),
      cities: this.cities?.map((c) => c.toJSON()) ?? undefined,
      weekdaySlots: this.weekdaySlots?.map((s) => s.toJSON()) ?? undefined,
      holidaySlots: this.holidaySlots?.map((s) => s.toJSON()) ?? undefined,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }

  toStorefrontJSON(opts?: { price?: number }) {
    return {
      id: this.id,
      name: this.name,
      carrier: this.carrier ?? '',
      estimatedDays: this.estimatedDays ?? '',
      baseCost: opts?.price != null ? opts.price : Number(this.baseCost) || 0,
      coverage: this.coverage === 'cities' ? 'cities' : 'nationwide',
      slotsEnabled: Boolean(this.slotsEnabled),
      expressEnabled: Boolean(this.expressEnabled),
      expressPrice: Number(this.expressPrice) || 0,
      expressDeadlineHour: Math.min(23, Math.max(0, Number(this.expressDeadlineHour) || 12)),
    }
  }
}
