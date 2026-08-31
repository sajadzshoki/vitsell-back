import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Wallet from '#models/wallet'
import User from '#models/user'

export type WalletTxType = 'topup' | 'purchase' | 'refund' | 'reward' | 'withdraw'
export type WalletTxStatus = 'success' | 'pending' | 'failed'

export default class WalletTransaction extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'wallet_transactions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare walletId: number

  @column()
  declare userId: number

  @column()
  declare type: WalletTxType

  @column()
  declare amount: number

  @column()
  declare signedAmount: number

  @column()
  declare status: WalletTxStatus

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare date: string

  @column()
  declare time: string

  @column()
  declare refId: string | null

  @column()
  declare authority: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Wallet)
  declare wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      amount: Number(this.amount),
      signedAmount: Number(this.signedAmount),
      status: this.status,
      title: this.title,
      ...(this.description ? { description: this.description } : {}),
      date: this.date,
      time: this.time,
      ...(this.refId ? { refId: this.refId } : {}),
    }
  }
}
