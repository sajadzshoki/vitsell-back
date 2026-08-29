import Address from '#models/address'
import CartItem from '#models/cart_item'
import DiscountCode from '#models/discount_code'
import Order from '#models/order'
import Payment from '#models/payment'
import Product from '#models/product'
import Notification from '#models/notification'
import ZarinpalService from '#services/zarinpal_service'
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

const FREE_SHIPPING_THRESHOLD = 500_000

function shippingPrice(method: 'express' | 'post' | 'pickup', subtotal: number) {
  if (method === 'pickup' || subtotal <= 0) return 0
  const free = subtotal >= FREE_SHIPPING_THRESHOLD
  if (method === 'express') return free ? 45_000 : 55_000
  return free ? 0 : 40_000
}

function shippingLabel(method: string) {
  if (method === 'express') return 'پیک اکسپرس'
  if (method === 'post') return 'پست پیشتاز'
  return 'دریافت حضوری'
}

function paymentLabel(method: string) {
  if (method === 'online') return 'پرداخت آنلاین'
  if (method === 'cod') return 'پرداخت در محل'
  return 'پرداخت اقساطی'
}

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default class CheckoutController {
  async place({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(placeValidator)

    const address = await Address.query()
      .where('user_id', user.id)
      .where('id', payload.addressId)
      .first()
    if (!address) {
      return response.unprocessableEntity({
        errors: [{ field: 'addressId', message: 'آدرس معتبر نیست' }],
      })
    }

    const cartItems = await CartItem.query()
      .where('user_id', user.id)
      .preload('product')

    if (!cartItems.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'cart', message: 'سبد خرید خالی است' }],
      })
    }

    const lines = cartItems.filter((i) => i.product)
    const subtotal = lines.reduce((sum, i) => sum + Number(i.product.price) * i.qty, 0)

    let discountAmount = 0
    let discountCode: string | null = null
    if (payload.discountCode) {
      const code = payload.discountCode.trim().toUpperCase()
      const row = await DiscountCode.find(code)
      if (!row || !row.active) {
        return response.unprocessableEntity({
          errors: [{ field: 'discountCode', message: 'کد تخفیف نامعتبر است' }],
        })
      }
      discountAmount = Math.floor(subtotal * row.percent)
      discountCode = code
    }

    const shipCost = shippingPrice(payload.shippingMethod, subtotal)
    const total = Math.max(0, subtotal - discountAmount + shipCost)
    const orderId = `BZ-${Math.floor(100000 + Math.random() * 900000)}`

    const orderItems = lines.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      price: Number(i.product.price),
    }))

    const isOnline = payload.paymentMethod === 'online'

    const order = await db.transaction(async (trx) => {
      const created = await Order.create(
        {
          id: orderId,
          userId: user.id,
          date: jalaliishDate(),
          status: isOnline ? 'pending_payment' : 'processing',
          items: orderItems,
          total,
          shippingMethod: shippingLabel(payload.shippingMethod),
          paymentMethod: paymentLabel(payload.paymentMethod),
          address: address.toJSON(),
          discountCode,
          discountAmount,
          shippingCost: shipCost,
        },
        { client: trx }
      )

      for (const line of lines) {
        line.product.soldCount += line.qty
        await line.product.useTransaction(trx).save()
      }

      if (!isOnline) {
        await CartItem.query({ client: trx }).where('user_id', user.id).delete()
        await Notification.create(
          {
            id: `n${Date.now()}`,
            userId: user.id,
            title: 'سفارش شما ثبت شد',
            description: `سفارش ${orderId} با موفقیت ثبت شد.`,
            time: 'همین الان',
            icon: 'i-tabler-package',
            read: false,
            to: `/order/${orderId}`,
          },
          { client: trx }
        )
      }

      return created
    })

    if (!isOnline) {
      return response.ok({ order: order.toShopOrderJSON() })
    }

    const zarinpal = new ZarinpalService()
    const amountRial = total * 10
    const { authority, paymentUrl } = await zarinpal.requestPayment({
      amountRial,
      description: `پرداخت سفارش ${orderId}`,
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
  }

  async zarinpalCallback({ request, response }: HttpContext) {
    const authority = String(request.input('Authority', ''))
    const status = String(request.input('Status', ''))
    const frontend = env.get('FRONTEND_URL')

    if (!authority) {
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    const payment = await Payment.query().where('authority', authority).preload('order').first()
    if (!payment || !payment.order) {
      return response.redirect(`${frontend}/cart?payment=failed`)
    }

    if (status !== 'OK') {
      payment.status = 'cancelled'
      await payment.save()
      payment.order.status = 'cancelled'
      await payment.order.save()
      return response.redirect(`${frontend}/cart?payment=cancelled`)
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
