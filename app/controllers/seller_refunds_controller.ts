import SellerOrder from '#models/seller_order'
import SellerRefund, {
  SELLER_REFUND_TRANSITIONS,
  type SellerRefundItem,
} from '#models/seller_refund'
import {
  refundsQueryValidator,
  storeRefundValidator,
  updateRefundStatusValidator,
} from '#validators/refunds'
import { querySellerRefunds, sumActiveRefundsForOrder } from '#utils/seller_refunds_query'
import { pushTimeline } from '#utils/seller_order_detail'
import {
  creditWalletForCompletedRefund,
  tryCreditWalletForCompletedRefund,
  WalletCreditError,
} from '#utils/wallet_credit'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

function nextRefundId() {
  return `RF-${Date.now().toString(36).toUpperCase()}`
}

export default class SellerRefundsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await refundsQueryValidator.validate(qs)
    const payload = await querySellerRefunds(filters)
    for (const item of payload.items) {
      if (item.status !== 'completed') continue
      const order = await SellerOrder.find(item.orderId)
      if (!order) continue
      await tryCreditWalletForCompletedRefund({
        sellerOrder: order,
        refundId: item.id,
        amount: item.amount,
        reason: item.reason,
      })
    }
    return response.ok(payload)
  }

  async show({ params, response }: HttpContext) {
    const row = await SellerRefund.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'بازپرداخت یافت نشد' }] })
    }
    if (row.status === 'completed') {
      const order = await SellerOrder.find(row.orderId)
      if (order) {
        const tx = await tryCreditWalletForCompletedRefund({
          sellerOrder: order,
          refundId: row.id,
          amount: Number(row.amount) || 0,
          reason: row.reason,
        })
        if (tx && !row.transactionId) {
          row.transactionId = tx.id
          await row.save()
        }
      }
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeRefundValidator)
    const order = await SellerOrder.find(payload.orderId.trim())
    if (!order) {
      return response.notFound({ errors: [{ field: 'orderId', message: 'سفارش یافت نشد' }] })
    }

    const amount = Math.round(payload.amount)
    const { completed, reserved } = await sumActiveRefundsForOrder(order.id)
    const remaining = Math.max(0, Number(order.total) - completed - reserved)
    if (amount <= 0 || amount > remaining) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: `مبلغ باید بین ۱ و ${remaining.toLocaleString('fa-IR')} باشد` }],
      })
    }

    const status = payload.status ?? 'pending'
    const items: SellerRefundItem[] = Array.isArray(payload.items)
      ? payload.items.map((item) => ({
          productId: (item.productId || '').toString(),
          productTitle: item.productTitle.trim(),
          qty: Math.max(1, Math.round(item.qty || 1)),
          amount: Math.max(0, Math.round(item.amount ?? amount)),
        }))
      : []

    try {
      const row = await db.transaction(async (trx) => {
        const created = await SellerRefund.create(
          {
            id: nextRefundId(),
            orderId: order.id,
            returnId: payload.returnId ?? null,
            customerName: order.customerName,
            status,
            amount,
            orderTotal: Number(order.total) || 0,
            alreadyRefunded: completed,
            reason: payload.reason.trim(),
            transactionId: (payload.transactionId ?? '').toString().trim(),
            items,
          },
          { client: trx }
        )
        created.useTransaction(trx)
        order.useTransaction(trx)

        if (status === 'completed') {
          const walletTx = await creditWalletForCompletedRefund({
            sellerOrder: order,
            refundId: created.id,
            amount,
            reason: created.reason,
            trx,
          })
          if (!created.transactionId) {
            created.transactionId = walletTx.id
            await created.save()
          }
          order.refundedAmount = completed + amount
          const embedded = Array.isArray(order.refunds) ? [...order.refunds] : []
          embedded.unshift({
            id: created.id,
            amount,
            reason: created.reason,
            status: 'completed',
            transactionId: created.transactionId,
            createdAt: created.createdAt?.toISO() || new Date().toISOString(),
            actorName: 'ادمین',
          })
          order.refunds = embedded
          pushTimeline(order, 'ثبت بازپرداخت', 'ادمین', `${amount.toLocaleString('fa-IR')} تومان`)
          await order.save()
        } else {
          pushTimeline(order, 'درخواست بازپرداخت', 'ادمین', created.id)
          await order.save()
        }

        return created
      })

      return response.created(row.toAdminJSON())
    } catch (error) {
      if (error instanceof WalletCreditError) {
        return response.unprocessableEntity({
          errors: [{ field: 'amount', message: error.message }],
        })
      }
      throw error
    }
  }

  async setStatus({ params, request, response }: HttpContext) {
    const row = await SellerRefund.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'بازپرداخت یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateRefundStatusValidator)
    const allowed = SELLER_REFUND_TRANSITIONS[row.status] ?? []
    if (payload.status !== row.status && !allowed.includes(payload.status)) {
      return response.unprocessableEntity({
        errors: [{ field: 'status', message: 'تغییر وضعیت بازپرداخت مجاز نیست' }],
      })
    }

    const previous = row.status

    try {
      await db.transaction(async (trx) => {
        row.useTransaction(trx)
        row.status = payload.status
        if (payload.transactionId != null) {
          row.transactionId = payload.transactionId.trim()
        }

        const order = await SellerOrder.query({ client: trx }).where('id', row.orderId).first()
        if (order) order.useTransaction(trx)

        if (payload.status === 'completed' && order) {
          const walletTx = await creditWalletForCompletedRefund({
            sellerOrder: order,
            refundId: row.id,
            amount: Number(row.amount) || 0,
            reason: row.reason,
            trx,
          })
          if (!row.transactionId) {
            row.transactionId = walletTx.id
          }
        } else if (payload.status === 'completed' && !row.transactionId) {
          row.transactionId = `TX-${Date.now().toString().slice(-8)}`
        }

        await row.save()

        if (order) {
          if (payload.status === 'completed' && previous !== 'completed') {
            const { completed } = await sumActiveRefundsForOrder(order.id, trx)
            order.refundedAmount = completed
            const embedded = Array.isArray(order.refunds) ? [...order.refunds] : []
            if (!embedded.some((r: any) => r.id === row.id)) {
              embedded.unshift({
                id: row.id,
                amount: Number(row.amount) || 0,
                reason: row.reason,
                status: 'completed',
                transactionId: row.transactionId,
                createdAt: new Date().toISOString(),
                actorName: 'ادمین',
              })
              order.refunds = embedded
            }
            pushTimeline(
              order,
              'تکمیل بازپرداخت',
              'ادمین',
              `${Number(row.amount).toLocaleString('fa-IR')} تومان`,
            )
            await order.save()
          } else if (previous === 'completed' && payload.status !== 'completed') {
            const { completed } = await sumActiveRefundsForOrder(order.id, trx)
            order.refundedAmount = completed
            await order.save()
          } else {
            pushTimeline(order, 'به‌روزرسانی بازپرداخت', 'ادمین', `${row.id}: ${payload.status}`)
            await order.save()
          }

          const { completed } = await sumActiveRefundsForOrder(order.id, trx)
          row.alreadyRefunded = Math.max(
            0,
            completed - (payload.status === 'completed' ? Number(row.amount) : 0)
          )
          await row.save()
        }
      })
    } catch (error) {
      if (error instanceof WalletCreditError) {
        return response.unprocessableEntity({
          errors: [{ field: 'status', message: error.message }],
        })
      }
      throw error
    }

    await row.refresh()
    return response.ok(row.toAdminJSON())
  }
}
