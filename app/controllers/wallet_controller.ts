import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import ZarinpalService from '#services/zarinpal_service'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

const MIN_TOPUP = 50_000
const MAX_TOPUP = 50_000_000
const MIN_WITHDRAW = 100_000

const topUpValidator = vine.compile(
  vine.object({
    amount: vine.number().min(MIN_TOPUP).max(MAX_TOPUP),
  })
)

const withdrawValidator = vine.compile(
  vine.object({
    amount: vine.number().min(MIN_WITHDRAW),
    cardNumber: vine.string().regex(/^\d{16}$/),
  })
)

function maskCardNumber(card: string) {
  return `${card.slice(0, 4)}-${card.slice(4, 6)}**-****-${card.slice(-4)}`
}

function jalaliishDateTime() {
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

async function ensureWallet(userId: number) {
  let wallet = await Wallet.query().where('user_id', userId).first()
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0 })
  }
  return wallet
}

function buildSummary(wallet: Wallet, transactions: WalletTransaction[]) {
  const monthStart = DateTime.now().startOf('month')
  let pendingWithdraw = 0
  let monthTopup = 0
  let monthSpent = 0

  for (const tx of transactions) {
    if (tx.type === 'withdraw' && tx.status === 'pending') {
      pendingWithdraw += Number(tx.amount)
    }
    if (tx.createdAt >= monthStart) {
      if (tx.type === 'topup' && tx.status === 'success') {
        monthTopup += Number(tx.amount)
      }
      if (
        (tx.type === 'purchase' || tx.type === 'withdraw') &&
        (tx.status === 'success' || tx.status === 'pending')
      ) {
        monthSpent += Number(tx.amount)
      }
    }
  }

  return {
    balance: Number(wallet.balance),
    pendingWithdraw,
    monthTopup,
    monthSpent,
  }
}

export default class WalletController {
  async show({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const wallet = await ensureWallet(user.id)
    const transactions = await WalletTransaction.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(100)

    return response.ok({
      summary: buildSummary(wallet, transactions),
      transactions: transactions.map((tx) => tx.toJSON()),
    })
  }

  async topUp({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { amount } = await request.validateUsing(topUpValidator)
    const wallet = await ensureWallet(user.id)
    const { date, time } = jalaliishDateTime()
    const txId = `wt${Date.now()}`

    const tx = await WalletTransaction.create({
      id: txId,
      walletId: wallet.id,
      userId: user.id,
      type: 'topup',
      amount,
      signedAmount: amount,
      status: 'pending',
      title: 'شارژ کیف پول',
      description: 'در انتظار پرداخت زرین‌پال',
      date,
      time,
      refId: null,
      authority: null,
    })

    const zarinpal = new ZarinpalService()
    const amountRial = amount * 10
    const appUrl = env
      .get('APP_URL')
      .replace(/\/\/0\.0\.0\.0(?=[:/]|$)/, '//localhost')
      .replace(/\/\/\[::\](?=[:/]|$)/, '//localhost')
    const callbackUrl = `${appUrl}/api/v1/payments/zarinpal/wallet-callback`

    try {
      const { authority, paymentUrl } = await zarinpal.requestPayment({
        amountRial,
        description: `شارژ کیف پول ${txId}`,
        mobile: user.phone,
        callbackUrl,
      })
      tx.authority = authority
      await tx.save()
      return response.ok({
        paymentUrl,
        transactionId: tx.id,
      })
    } catch {
      tx.status = 'failed'
      tx.description = 'خطا در اتصال به درگاه پرداخت'
      await tx.save()
      return response.badGateway({
        errors: [{ field: 'payment', message: 'اتصال به درگاه پرداخت ناموفق بود' }],
      })
    }
  }

  async withdraw({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(withdrawValidator)
    const wallet = await ensureWallet(user.id)

    if (payload.amount > Number(wallet.balance)) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: 'موجودی کافی نیست' }],
      })
    }

    const { date, time } = jalaliishDateTime()
    const txId = `wt${Date.now()}`
    const refId = `WD-${Math.floor(1000 + Math.random() * 9000)}`
    const cardHint = `واریز به کارت ‎${maskCardNumber(payload.cardNumber)}`

    const tx = await db.transaction(async (trx) => {
      const locked = await Wallet.query({ client: trx })
        .where('id', wallet.id)
        .forUpdate()
        .firstOrFail()

      if (payload.amount > Number(locked.balance)) {
        throw new Error('INSUFFICIENT')
      }

      locked.balance = Number(locked.balance) - payload.amount
      await locked.useTransaction(trx).save()

      return WalletTransaction.create(
        {
          id: txId,
          walletId: locked.id,
          userId: user.id,
          type: 'withdraw',
          amount: payload.amount,
          signedAmount: -payload.amount,
          status: 'pending',
          title: 'درخواست برداشت',
          description: cardHint,
          date,
          time,
          refId,
          authority: null,
        },
        { client: trx }
      )
    }).catch((error) => {
      if (error instanceof Error && error.message === 'INSUFFICIENT') {
        return null
      }
      throw error
    })

    if (!tx) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: 'موجودی کافی نیست' }],
      })
    }

    await wallet.refresh()
    const transactions = await WalletTransaction.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(100)

    return response.ok({
      transaction: tx.toJSON(),
      summary: buildSummary(wallet, transactions),
    })
  }

  async zarinpalCallback({ request, response }: HttpContext) {
    const authority = String(request.input('Authority', ''))
    const status = String(request.input('Status', ''))
    const frontend = env.get('FRONTEND_URL').replace(/\/$/, '')

    const redirectWallet = (topup: 'ok' | 'failed' | 'cancelled') => {
      return response
        .redirect()
        .withQs(false)
        .toPath(`${frontend}/account/wallet?topup=${topup}`)
    }

    if (!authority) {
      return redirectWallet('failed')
    }

    const tx = await WalletTransaction.query()
      .where('authority', authority)
      .where('type', 'topup')
      .first()

    if (!tx) {
      return redirectWallet('failed')
    }

    if (tx.status === 'success') {
      return redirectWallet('ok')
    }

    if (status !== 'OK') {
      tx.status = 'failed'
      tx.description = 'پرداخت در درگاه لغو شد'
      await tx.save()
      return redirectWallet('cancelled')
    }

    const zarinpal = new ZarinpalService()
    const result = await zarinpal.verifyPayment({
      amountRial: Number(tx.amount) * 10,
      authority,
    })

    if (!result.ok) {
      tx.status = 'failed'
      tx.description = 'تأیید پرداخت ناموفق بود'
      await tx.save()
      return redirectWallet('failed')
    }

    await db.transaction(async (trx) => {
      const lockedTx = await WalletTransaction.query({ client: trx })
        .where('id', tx.id)
        .forUpdate()
        .firstOrFail()

      if (lockedTx.status === 'success') return

      const wallet = await Wallet.query({ client: trx })
        .where('id', lockedTx.walletId)
        .forUpdate()
        .firstOrFail()

      wallet.balance = Number(wallet.balance) + Number(lockedTx.amount)
      await wallet.useTransaction(trx).save()

      lockedTx.status = 'success'
      lockedTx.refId = result.refId ? `ZP-${result.refId}` : lockedTx.refId
      lockedTx.description = 'پرداخت از طریق زرین‌پال'
      await lockedTx.useTransaction(trx).save()
    })

    return redirectWallet('ok')
  }
}
