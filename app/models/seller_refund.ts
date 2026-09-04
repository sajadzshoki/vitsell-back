import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type SellerRefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type SellerRefundItem = {
  productId: string
  productTitle: string
  qty: number
  amount: number
}

export const SELLER_REFUND_TRANSITIONS: Record<SellerRefundStatus, SellerRefundStatus[]> = {
  pending: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
}

export default class SellerRefund extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_refunds'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare returnId: string | null

  @column()
  declare customerName: string

  @column()
  declare status: SellerRefundStatus

  @column()
  declare amount: number

  @column()
  declare orderTotal: number

  @column()
  declare alreadyRefunded: number

  @column()
  declare reason: string

  @column()
  declare transactionId: string

  @column({
    prepare: (value: SellerRefundItem[]) => JSON.stringify(value ?? []),
    consume: (value: SellerRefundItem[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [],
  })
  declare items: SellerRefundItem[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      returnId: this.returnId,
      customerName: this.customerName,
      status: this.status,
      amount: Number(this.amount) || 0,
      orderTotal: Number(this.orderTotal) || 0,
      alreadyRefunded: Number(this.alreadyRefunded) || 0,
      reason: this.reason ?? '',
      transactionId: this.transactionId ?? '',
      items: Array.isArray(this.items) ? this.items : [],
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
