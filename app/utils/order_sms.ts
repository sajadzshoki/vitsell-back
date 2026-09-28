import logger from '@adonisjs/core/services/logger'
import Order from '#models/order'
import SellerOrder from '#models/seller_order'
import KavenegarService from '#services/kavenegar_service'
import { pushTimeline } from '#utils/seller_order_detail'

const PLACED_EVENT = 'پیامک ثبت سفارش'
const READY_EVENT = 'پیامک آماده ارسال'

export function irMobile(value: string | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (/^09\d{9}$/.test(digits)) return digits
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`
  if (/^9\d{9}$/.test(digits)) return `0${digits}`
  return ''
}

function toman(amount: number) {
  const rounded = Math.round(Number(amount) || 0)
  return `${rounded.toLocaleString('fa-IR')} تومان`
}

/** Full placed-order SMS. Sent as one plain message, not lookup tokens. */
export function placedOrderMessage(input: { orderId: string; deliveryCode: string; total: number }) {
  return [
    'ویتسل',
    `سفارش ${input.orderId} ثبت شد.`,
    `کد تحویل: ${input.deliveryCode}`,
    `مبلغ: ${toman(input.total)}`,
  ].join('\n')
}

/** Full ready-to-ship SMS. Tracking line is omitted until a code exists. */
export function readyToShipMessage(input: {
  orderId: string
  deliveryCode: string
  trackingCode?: string | null
}) {
  const tracking = String(input.trackingCode || '').trim()
  const lines = [
    'ویتسل',
    `سفارش ${input.orderId} آماده ارسال است.`,
    `کد تحویل: ${input.deliveryCode}`,
  ]
  if (tracking) lines.push(`کد پیگیری: ${tracking}`)
  return lines.join('\n')
}

function alreadySent(order: SellerOrder, event: string, detail?: string) {
  const timeline = Array.isArray(order.timeline) ? order.timeline : []
  return timeline.some((row) => {
    if (row.event !== event) return false
    if (detail == null) return true
    return row.detail === detail
  })
}

function buyerPhone(order: Order | null, seller?: SellerOrder | null) {
  return (
    irMobile(order?.user?.phone) ||
    irMobile(seller?.customerPhone) ||
    irMobile(order?.address?.phone) ||
    ''
  )
}

/**
 * After the order is confirmed: COD/installment at checkout, online after payment.
 */
export async function notifyOrderPlaced(buyerOrderId: string) {
  try {
    const order = await Order.query().where('id', buyerOrderId).preload('user').first()
    if (!order || order.status === 'pending_payment' || order.status === 'cancelled') return

    const sellerOrders = await SellerOrder.query().where('buyerOrderId', order.id)
    if (!sellerOrders.length) return

    const phone = buyerPhone(order, sellerOrders[0])
    if (!phone) {
      logger.warn({ orderId: order.id }, '[order-sms] no mobile for placed notice')
      return
    }

    const kavenegar = new KavenegarService()

    for (const seller of sellerOrders) {
      if (alreadySent(seller, PLACED_EVENT)) continue
      const delivery = String(seller.deliveryCode || '').trim()
      if (!delivery) {
        logger.warn({ sellerOrderId: seller.id }, '[order-sms] missing delivery code')
        continue
      }

      const result = await kavenegar.sendPlain(
        phone,
        placedOrderMessage({
          orderId: order.id,
          deliveryCode: delivery,
          total: Number(order.total) || 0,
        })
      )
      if (!result.ok) continue

      pushTimeline(seller, PLACED_EVENT, 'سیستم', delivery)
      await seller.save()
    }
  } catch (error) {
    logger.error({ err: error, buyerOrderId }, '[order-sms] placed notice failed')
  }
}

/**
 * When the seller order is ready to ship (packing), or when a tracking code
 * is saved later while it is packing/shipped.
 */
export async function notifyOrderReadyToShip(sellerOrId: SellerOrder | string) {
  const sellerOrderId = typeof sellerOrId === 'string' ? sellerOrId : sellerOrId.id
  try {
    const seller =
      typeof sellerOrId === 'string' ? await SellerOrder.find(sellerOrId) : sellerOrId
    if (!seller) return
    if (seller.status !== 'packing' && seller.status !== 'shipped') return

    const tracking = String(seller.trackingCode || '').trim()
    if (alreadySent(seller, READY_EVENT, tracking)) return

    const buyer = seller.buyerOrderId
      ? await Order.query().where('id', seller.buyerOrderId).preload('user').first()
      : null
    if (buyer && (buyer.status === 'pending_payment' || buyer.status === 'cancelled')) return

    const phone = buyerPhone(buyer, seller)
    if (!phone) {
      logger.warn({ sellerOrderId }, '[order-sms] no mobile for ready notice')
      return
    }

    const delivery = String(seller.deliveryCode || '').trim()
    if (!delivery) {
      logger.warn({ sellerOrderId }, '[order-sms] missing delivery code')
      return
    }

    const result = await new KavenegarService().sendPlain(
      phone,
      readyToShipMessage({
        orderId: buyer?.id || seller.id,
        deliveryCode: delivery,
        trackingCode: tracking,
      })
    )
    if (!result.ok) return

    pushTimeline(seller, READY_EVENT, 'سیستم', tracking)
    await seller.save()
  } catch (error) {
    logger.error({ err: error, sellerOrderId }, '[order-sms] ready notice failed')
  }
}
