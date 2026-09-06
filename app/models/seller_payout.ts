import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'

export type SellerSettlementStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'reconciled'

export type SellerSettlementSource = 'gateway' | 'bank' | 'manual'

export default class SellerPayout extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_payouts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare shopId: number

  @column()
  declare date: string

  @column()
  declare amount: number

  @column()
  declare status: 'paid' | 'pending'

  @column()
  declare fees: number

  @column()
  declare gateway: string

  @column()
  declare source: SellerSettlementSource

  @column()
  declare reference: string

  @column()
  declare note: string | null

  @column()
  declare settlementStatus: SellerSettlementStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShop, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof SellerShop>

  /** Backward-compatible payout payload */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      amount: Number(this.amount),
      status: this.status,
    }
  }

  toSettlementJSON() {
    const amount = Number(this.amount) || 0
    const fees = Number(this.fees) || 0
    const settlementStatus =
      this.settlementStatus
      || (this.status === 'paid' ? 'completed' : 'pending')
    const createdAt = this.createdAt?.toISO() || this.date
    const updatedAt = this.updatedAt?.toISO() || createdAt
    return {
      id: this.id.startsWith('stl-') ? this.id : `stl-${this.id}`,
      payoutId: this.id,
      source: (this.source || 'gateway') as SellerSettlementSource,
      gateway: this.gateway || 'زرین‌پال',
      amount,
      fees,
      netAmount: Math.max(0, amount - fees),
      status: settlementStatus as SellerSettlementStatus,
      settlementDate: this.date,
      reference: this.reference || '',
      relatedPaymentIds: [] as string[],
      relatedTransactionIds: [] as string[],
      note: this.note || '',
      createdAt,
      updatedAt,
    }
  }
}
