import Payment from '#models/payment'
import CartItem from '#models/cart_item'
import Notification from '#models/notification'
import CheckoutService, { CheckoutError } from '#services/checkout_service'
import ZarinpalService, { PaymentUnavailableError } from '#services/zarinpal_service'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

const placeValidator = vine.compile(
  vine.object({
    addressId: vine.string(),
    shippingMethod: vine.enum(['express', 'post', 'pickup'] as const),
    paymentMethod: vine.enum(['online', 'cod', 'installment'] as const),
    discountCode: vine.string().optional(),
  })
)

export default class CheckoutController {
  async place({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(placeValidator)
    const checkout = new CheckoutService()

    try {
      const { order, total, isOnline } = await checkout.place(user, payload)

      if (!isOnline) {
        return response.ok({ order: order.toShopOrderJSON() })
      }

      const zarinpal = new ZarinpalService()
      const amountRial = total * 10
      const { authority, paymentUrl } = await zarinpal.requestPayment({
        amountRial,
        description: `پرداخت سفارش ${order.id}`,
        mobile: user.phone,
      })

      await Payment.create({
        orderId: order.id,
        authority,
        amount: amountRial,
        status: 'pending',
        refId: null,
        cardPan: null,
      })

      return response.ok({
        orderId: order.id,
        paymentUrl,
      })
    } catch (error) {
      if (error instanceof CheckoutError) {
        if (error.status === 409) {
          return response.conflict({
            errors: [{ field: error.field, message: error.message }],
          })
        }
        return response.unprocessableEntity({
          errors: [{ field: error.field, message: error.message }],
        })
      }
      if (error instanceof PaymentUnavailableError) {
        return response.serviceUnavailable({
          errors: [{ field: 'payment', message: error.message }],
        })
      }
      throw error
    }
  }

  async zarinpalCallback({ request, response }: HttpContext) {
    const authority = String(request.input('Authority', ''))
    const status = String(request.input('Status', ''))
    const frontend = env.get('FRONTEND_URL')
    const checkout = new CheckoutService()

    if (!authority) {
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    const payment = await Payment.query().where('authority', authority).preload('order').first()
    if (!payment || !payment.order) {
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    if (payment.status === 'paid') {
      return response.redirect(`${frontend}/order/${payment.order.id}?payment=ok`)
    }

    if (status !== 'OK') {
      await db.transaction(async (trx) => {
        payment.useTransaction(trx)
        payment.status = 'cancelled'
        await payment.save()
        payment.order.useTransaction(trx)
        payment.order.status = 'cancelled'
        await payment.order.save()
        await checkout.restoreStockForOrder(payment.order.id, trx)
      })
      return response.redirect(`${frontend}/cart?payment=cancelled`)
    }

    const zarinpal = new ZarinpalService()
    let result
    try {
      result = await zarinpal.verifyPayment({
        amountRial: Number(payment.amount),
        authority,
      })
    } catch {
      await db.transaction(async (trx) => {
        payment.useTransaction(trx)
        payment.status = 'failed'
        await payment.save()
        payment.order.useTransaction(trx)
        payment.order.status = 'cancelled'
        await payment.order.save()
        await checkout.restoreStockForOrder(payment.order.id, trx)
      })
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    if (!result.ok) {
      await db.transaction(async (trx) => {
        payment.useTransaction(trx)
        payment.status = 'failed'
        await payment.save()
        payment.order.useTransaction(trx)
        payment.order.status = 'cancelled'
        await payment.order.save()
        await checkout.restoreStockForOrder(payment.order.id, trx)
      })
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    payment.status = 'paid'
    payment.refId = result.refId ?? null
    payment.cardPan = result.cardPan ?? null
    await payment.save()

    payment.order.status = 'processing'
    await payment.order.save()

    await CartItem.query().where('user_id', payment.order.userId).delete()

    await Notification.create({
      id: `n${Date.now()}`,
      userId: payment.order.userId,
      title: 'پرداخت موفق',
      description: `پرداخت سفارش ${payment.order.id} با موفقیت انجام شد.`,
      time: 'همین الان',
      icon: 'i-tabler-credit-card',
      read: false,
      to: `/order/${payment.order.id}`,
    })

    return response.redirect(`${frontend}/order/${payment.order.id}?payment=ok`)
  }
}
