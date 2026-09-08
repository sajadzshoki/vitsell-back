import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type StoreDiscountType = 'percent' | 'fixed'
export type StoreDiscountStatus = 'active' | 'inactive'

export type StoreDiscountTargeting = {
  scope: 'store' | 'products' | 'categories' | 'brands'
  productIds: string[]
  categoryIds: string[]
  brandIds: string[]
  excludeProductIds: string[]
  excludeCategoryIds: string[]
  excludeBrandIds: string[]
}

export function emptyStoreDiscountTargeting(): StoreDiscountTargeting {
  return {
    scope: 'store',
    productIds: [],
    categoryIds: [],
    brandIds: [],
    excludeProductIds: [],
    excludeCategoryIds: [],
    excludeBrandIds: [],
  }
}

export default class StoreDiscount extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'store_discounts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare type: StoreDiscountType

  @column()
  declare value: number

  @column()
  declare minOrder: number

  @column()
  declare maxDiscount: number | null

  @column.dateTime()
  declare startsAt: DateTime | null

  @column.dateTime()
  declare endsAt: DateTime | null

  @column()
  declare status: StoreDiscountStatus

  @column()
  declare usageLimit: number | null

  @column()
  declare usageCount: number

  @column()
  declare perCustomerLimit: number | null

  @column()
  declare priority: number

  @column({
    prepare: (value: StoreDiscountTargeting | null) =>
      value ? JSON.stringify(value) : JSON.stringify(emptyStoreDiscountTargeting()),
    consume: (value: StoreDiscountTargeting | string | null) => {
      if (!value) return emptyStoreDiscountTargeting()
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      return { ...emptyStoreDiscountTargeting(), ...parsed }
    },
  })
  declare targeting: StoreDiscountTargeting

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description ?? '',
      type: this.type,
      value: Number(this.value) || 0,
      minOrder: Number(this.minOrder) || 0,
      maxDiscount: this.maxDiscount == null ? null : Number(this.maxDiscount),
      startsAt: this.startsAt?.toISO() ?? null,
      endsAt: this.endsAt?.toISO() ?? null,
      status: this.status,
      usageLimit: this.usageLimit == null ? null : Number(this.usageLimit),
      usageCount: Number(this.usageCount) || 0,
      perCustomerLimit: this.perCustomerLimit == null ? null : Number(this.perCustomerLimit),
      priority: Number(this.priority) || 0,
      targeting: this.targeting ?? emptyStoreDiscountTargeting(),
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
