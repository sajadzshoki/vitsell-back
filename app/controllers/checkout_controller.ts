import CartItem from '#models/cart_item'
import Notification from '#models/notification'
import Payment from '#models/payment'
import CheckoutService, { CheckoutError } from '#services/checkout_service'
import ZarinpalService from '#services/zarinpal_service'
import { loadPlatformSettings } from '#utils/platform_settings'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import {
  resolvePaymentReturnBase,
  zarinpalCallbackUrlWithReturn,
} from '#utils/payment_return_url'
import { notifyOrderPlaced } from '#utils/order_sms'

const placeValidator = vine.compile(
  vine.object({
    addressId: vine.string(),
    shippingMethod: vine.enum(['express', 'post', 'pickup'] as const),
    paymentMethod: vine.enum(['online', 'cod', 'installment'] as const),
    discountCode: vine.string().optional(),
    /** Storefront origin (e.g. https://vitsell.ir) — used after Zarinpal return. */
    returnOrigin: vine.string().optional(),
  })
)

function isPaymentMethodEnabled(
  method: 'online' | 'cod' | 'installment',
  settings: Awaited<ReturnType<typeof loadPlatformSettings>>
) {
  if (method === 'online') return settings.onlinePaymentEnabled
  if (method === 'cod') return settings.codPaymentEnabled
  return settings.installmentPaymentEnabled
}

export default class CheckoutController {
  async place({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(placeValidator)

    const platform = await loadPlatformSettings()
    if (!isPaymentMethodEnabled(payload.paymentMethod, platform)) {
      return response.unprocessableEntity({
        errors: [{ field: 'paymentMethod', message: 'این روش پرداخت فعال نیست' }],
      })
    }

    const checkout = new CheckoutService()
    let placed: Awaited<ReturnType<CheckoutService['place']>>
    try {
      placed = await checkout.place(user, {
        addressId: payload.addressId,
        shippingMethod: payload.shippingMethod,
        paymentMethod: payload.paymentMethod,
        discountCode: payload.discountCode,
      })
    } catch (err) {
      if (err instanceof CheckoutError) {
        if (err.status === 409) {
          return response.conflict({
            errors: [{ field: err.field, message: err.message }],
          })
        }
        return response.unprocessableEntity({
          errors: [{ field: err.field, message: err.message }],
        })
      }
      throw err
    }

    const { order, total, isOnline } = placed

    if (!isOnline) {
      return response.ok({ order: order.toShopOrderJSON() })
    }

    const zarinpal = new ZarinpalService()
    const amountRial = total * 10
    const returnBase = resolvePaymentReturnBase(
      payload.returnOrigin,
      request.header('origin'),
      request.header('referer')
    )
    const { authority, paymentUrl } = await zarinpal.requestPayment({
      amountRial,
      description: `پرداخت سفارش ${order.id}`,
      mobile: user.phone,
      callbackUrl: zarinpalCallbackUrlWithReturn(
        '/api/v1/payments/zarinpal/callback',
        returnBase
      ),
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
  }

  async zarinpalCallback({ request, response }: HttpContext) {
    const authority = String(request.input('Authority') || request.input('authority') || '').trim()
    const status = String(request.input('Status') || request.input('status') || '')
      .trim()
      .toUpperCase()
    const frontend = resolvePaymentReturnBase(
      request.input('ro'),
      request.header('origin'),
      request.header('referer')
    ).replace(/\/$/, '')

    const redirectCart = (payment: string, extra?: Record<string, string>) => {
      const qs = new URLSearchParams({ payment, ...(extra || {}) })
      return response.redirect().withQs(false).toPath(`${frontend}/cart?${qs.toString()}`)
    }
    const redirectOrder = (orderId: string) =>
      response
        .redirect()
        .withQs(false)
        .toPath(`${frontend}/order/${encodeURIComponent(orderId)}?payment=ok`)

    if (!authority) {
      return redirectCart('failed', { reason: 'no_authority' })
    }

    const payment = await Payment.query().where('authority', authority).preload('order').first()
    if (!payment || !payment.order) {
      return redirectCart('failed', { reason: 'payment_not_found' })
    }

    // Already verified (e.g. double callback / refresh) → order detail
    if (payment.status === 'paid') {
      return redirectOrder(payment.order.id)
    }

    const checkout = new CheckoutService()

    if (status !== 'OK') {
      payment.status = 'cancelled'
      await payment.save()
      payment.order.status = 'cancelled'
      await payment.order.save()
      await checkout.cancelAfterFailedPayment(payment.order.id)
      return redirectCart('cancelled')
    }

    const zarinpal = new ZarinpalService()
    const result = await zarinpal.verifyPayment({
      amountRial: Number(payment.amount),
      authority,
    })

    if (!result.ok) {
      payment.status = 'failed'
      await payment.save()
      payment.order.status = 'cancelled'
      await payment.order.save()
      await checkout.cancelAfterFailedPayment(payment.order.id)
      return redirectCart('failed', {
        reason: 'verify',
        code: String(result.code || 0),
      })
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

    await notifyOrderPlaced(payment.order.id)

    return redirectOrder(payment.order.id)
  }
}
