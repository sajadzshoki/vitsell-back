import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type SellerReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'received'
  | 'processing'
  | 'completed'
  | 'cancelled'

export type SellerReturnItem = {
  productId: string
  productTitle: string
  variantId?: string | null
  variantLabel: string | null
  sku: string
  qty: number
  unitPrice: number
}

export const SELLER_RETURN_TRANSITIONS: Record<SellerReturnStatus, SellerReturnStatus[]> = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['received', 'cancelled'],
  rejected: [],
  received: ['processing', 'completed'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export default class SellerReturn extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_returns'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare customerId: string

  @column()
  declare customerName: string

  @column()
  declare status: SellerReturnStatus

  @column()
  declare reason: string

  @column()
  declare adminNote: string

  @column.dateTime()
  declare requestedAt: DateTime

  @column({
    prepare: (value: SellerReturnItem[]) => JSON.stringify(value ?? []),
    consume: (value: SellerReturnItem[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [],
  })
  declare items: SellerReturnItem[]

  @column({
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: string[] | string | null) => {
      if (Array.isArray(value)) return value.filter((url) => typeof url === 'string')
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string') : []
        } catch {
          return []
        }
      }
      return []
    },
  })
  declare photos: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      customerId: this.customerId ?? '',
      customerName: this.customerName,
      status: this.status,
      reason: this.reason ?? '',
      adminNote: this.adminNote ?? '',
      requestedAt: this.requestedAt?.toISO() ?? this.createdAt?.toISO() ?? null,
      items: Array.isArray(this.items) ? this.items : [],
      photos: Array.isArray(this.photos) ? this.photos : [],
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
