import Order from '#models/order'
import SellerOrder from '#models/seller_order'
import User from '#models/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import { irMobile } from '#utils/order_sms'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import logger from '@adonisjs/core/services/logger'

export class WalletCreditError extends Error {
  constructor(
    public code: 'NO_USER' | 'INVALID_AMOUNT',
    message: string
  ) {
    super(message)
    this.name = 'WalletCreditError'
  }
}

export function jalaliishDateTime() {
  const date = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const time = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  return { date, time }
}

export async function resolveOrderBuyerUserId(
  order: SellerOrder,
  trx?: TransactionClientContract
) {
  if (order.buyerOrderId) {
    const buyerQuery = trx ? Order.query({ client: trx }) : Order.query()
    const buyer = await buyerQuery.where('id', order.buyerOrderId).first()
    if (buyer?.userId) return buyer.userId
  }

  const phone = irMobile(order.customerPhone)
  if (!phone) return null

  const userQuery = trx ? User.query({ client: trx }) : User.query()
  const user = await userQuery
    .where('phone', phone)
    .orWhere('phone', `+98${phone.slice(1)}`)
    .orWhere('phone', phone.slice(1))
    .first()
  return user?.id ?? null
}

async function existingRefundTx(refundId: string, trx: TransactionClientContract) {
  return WalletTransaction.query({ client: trx })
    .where('type', 'refund')
    .where('ref_id', refundId)
    .where('status', 'success')
    .first()
}

async function creditInTrx(input: {
  sellerOrder: SellerOrder
  refundId: string
  amount: number
  reason?: string | null
  trx: TransactionClientContract
}) {
  const amount = Math.round(Number(input.amount) || 0)
  if (amount <= 0) {
    throw new WalletCreditError('INVALID_AMOUNT', 'مبلغ بازپرداخت نامعتبر است')
  }

  const userId = await resolveOrderBuyerUserId(input.sellerOrder, input.trx)
  if (!userId) {
    throw new WalletCreditError(
      'NO_USER',
      'حساب کاربری مشتری برای واریز به کیف پول یافت نشد'
    )
  }

  let wallet = await Wallet.query({ client: input.trx }).where('user_id', userId).forUpdate().first()
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0 }, { client: input.trx })
    wallet = await Wallet.query({ client: input.trx }).where('id', wallet.id).forUpdate().firstOrFail()
  }

  const existing = await existingRefundTx(input.refundId, input.trx)
  if (existing) return existing

  wallet.balance = Number(wallet.balance) + amount
  await wallet.useTransaction(input.trx).save()

  const { date, time } = jalaliishDateTime()
  return WalletTransaction.create(
    {
      id: `wt${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      walletId: wallet.id,
      userId,
      type: 'refund',
      amount,
      signedAmount: amount,
      status: 'success',
      title: `بازگشت وجه سفارش ${input.sellerOrder.id}`,
      description: (input.reason || 'بازپرداخت به کیف پول').toString(),
      date,
      time,
      refId: input.refundId,
      authority: null,
    },
    { client: input.trx }
  )
}

/** Idempotent: same refund id never credits twice. */
export async function creditWalletForCompletedRefund(input: {
  sellerOrder: SellerOrder
  refundId: string
  amount: number
  reason?: string | null
  trx?: TransactionClientContract
}) {
  if (input.trx) return creditInTrx({ ...input, trx: input.trx })
  return db.transaction((trx) => creditInTrx({ ...input, trx }))
}

export async function tryCreditWalletForCompletedRefund(input: {
  sellerOrder: SellerOrder
  refundId: string
  amount: number
  reason?: string | null
}) {
  try {
    return await creditWalletForCompletedRefund(input)
  } catch (error) {
    if (error instanceof WalletCreditError) {
      logger.warn(
        { err: error, refundId: input.refundId, orderId: input.sellerOrder.id, code: error.code },
        '[wallet] refund credit skipped'
      )
      return null
    }
    throw error
  }
}
