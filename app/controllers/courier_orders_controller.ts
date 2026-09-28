import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import SellerOrder from '#models/seller_order'
import type { SellerOrderItem } from '#models/seller_order'
import { deliveryCodesMatch } from '#utils/delivery_code'
import { pushTimeline, syncBuyerOrderStatus } from '#utils/seller_order_detail'
import { deliverOrderValidator } from '#validators/couriers'
import type { HttpContext } from '@adonisjs/core/http'

const DELIVERY_ATTEMPT_LIMIT = 5
const DELIVERY_LOCK_MINUTES = 15
const WRONG_CODE = 'کد تحویل نادرست است'

const OPENABLE: SellerOrder['status'][] = ['new', 'packing', 'shipped']

function displayDate(order: SellerOrder) {
  const stored = String(order.date || '').trim()
  if (stored) return stored
  if (!order.createdAt) return ''
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(order.createdAt.toJSDate())
}

async function toCourierOrder(order: SellerOrder) {
  const items = Array.isArray(order.items) ? order.items : []
  const ids = [...new Set(items.map((item) => String(item.productId || '')).filter(Boolean))]
  const products = ids.length
    ? await Product.query().whereIn('id', ids).select('id', 'title')
    : []
  const titles = new Map(products.map((product) => [product.id, product.title]))

  return {
    id: order.id,
    status: order.status,
    date: displayDate(order),
    receiverName: order.customerName,
    phone: order.customerPhone,
    city: order.city,
    address: {
      province: order.address?.province || '',
      city: order.address?.city || order.city || '',
      address: order.address?.address || '',
      postalCode: order.address?.postalCode || '',
    },
    items: items.map((item: SellerOrderItem) => ({
      title: titles.get(String(item.productId)) || 'کالا',
      variantLabel: item.variantLabel || '',
      qty: Number(item.qty) || 0,
    })),
    total: Number(order.total) || 0,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    note: order.note || '',
  }
}

function wrongCode(response: HttpContext['response']) {
  return response.unprocessableEntity({
    errors: [{ message: WRONG_CODE }],
  })
}

export default class CourierOrdersController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const orders = await SellerOrder.query()
      .where('courier_id', user.id)
      .orderBy('created_at', 'desc')
    return response.ok({
      items: await Promise.all(orders.map((order) => toCourierOrder(order))),
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await SellerOrder.query()
      .where('id', String(params.id || ''))
      .where('courier_id', user.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ message: 'سفارش یافت نشد' }] })
    }
    return response.ok(await toCourierOrder(order))
  }

  async deliver({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { code } = await request.validateUsing(deliverOrderValidator)

    const delivered = await db.transaction(async (trx) => {
      const order = await SellerOrder.query({ client: trx })
        .where('id', String(params.id || ''))
        .where('courier_id', user.id)
        .forUpdate()
        .first()
      if (!order) return { missing: true as const }
      order.useTransaction(trx)

      if (!OPENABLE.includes(order.status)) {
        return { blocked: true as const }
      }

      const now = DateTime.utc()
      const lockedUntil = order.deliveryAttemptResetAt
      if (lockedUntil && lockedUntil > now && order.deliveryAttemptCount >= DELIVERY_ATTEMPT_LIMIT) {
        return { mismatch: true as const }
      }
      if (lockedUntil && lockedUntil <= now) {
        order.deliveryAttemptCount = 0
        order.deliveryAttemptResetAt = null
      }

      if (!deliveryCodesMatch(order.deliveryCode || '', code)) {
        order.deliveryAttemptCount = Number(order.deliveryAttemptCount || 0) + 1
        if (order.deliveryAttemptCount >= DELIVERY_ATTEMPT_LIMIT) {
          order.deliveryAttemptResetAt = now.plus({ minutes: DELIVERY_LOCK_MINUTES })
        }
        await order.save()
        return { mismatch: true as const }
      }

      order.deliveryAttemptCount = 0
      order.deliveryAttemptResetAt = null
      const previous = order.status
      order.status = 'delivered'
      pushTimeline(order, 'تحویل سفارش', 'پیک', `${previous} → delivered`)
      await order.save()
      await syncBuyerOrderStatus(order)
      return { order }
    })

    if ('missing' in delivered && delivered.missing) {
      return response.notFound({ errors: [{ message: 'سفارش یافت نشد' }] })
    }
    if ('blocked' in delivered && delivered.blocked) {
      return response.unprocessableEntity({
        errors: [{ message: 'تغییر وضعیت این سفارش مجاز نیست' }],
      })
    }
    if ('mismatch' in delivered && delivered.mismatch) {
      return wrongCode(response)
    }
    if (!('order' in delivered)) {
      return wrongCode(response)
    }
    return response.ok(await toCourierOrder(delivered.order))
  }
}
