import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import Order from '#models/order'
import SellerOrder from '#models/seller_order'
import KavenegarService from '#services/kavenegar_service'
import { pushTimeline } from '#utils/seller_order_detail'

const PLACED_EVENT = 'پیامک ثبت سفارش'
const READY_EVENT = 'پیامک آماده ارسال'
const MISSING_TRACKING = 'ندارد'

/**
 * Kavenegar lookup tokens allow Persian, English, and digits only.
 * Spaces, hyphens, and underscores are rejected (API status 431).
 */
export function kavenegarLookupToken(value: string, fallback: string) {
  let text = String(value ?? '')
  const persian = '۰۱۲۳۴۵۶۷۸۹'
  const arabic = '٠١٢٣٤٥٦٧٨٩'
  for (let i = 0; i < 10; i++) {
    text = text.replaceAll(persian[i]!, String(i)).replaceAll(arabic[i]!, String(i))
  }
  const cleaned = text.replace(/[^0-9A-Za-z\u0600-\u06FF]/g, '')
  return (cleaned || fallback).slice(0, 100)
}

export function irMobile(value: string | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (/^09\d{9}$/.test(digits)) return digits
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`
  if (/^9\d{9}$/.test(digits)) return `0${digits}`
  return ''
}

function orderTemplate(
  key: 'KAVENEGAR_ORDER_PLACED_TEMPLATE' | 'KAVENEGAR_ORDER_READY_TEMPLATE',
  fallback: string
) {
  const value = env.get(key)
  if (value == null) return fallback
  return value.trim()
}

function alreadySent(order: SellerOrder, event: string, detail?: string) {
  const timeline = Array.isArray(order.timeline) ? order.timeline : []
  return timeline.some((row) => {
    if (row.event !== event) return false
    if (detail == null) return true
    return row.detail === detail
  })
}

async function buyerPhone(order: Order | null, seller?: SellerOrder | null) {
  return (
    irMobile(order?.user?.phone) ||
    irMobile(seller?.customerPhone) ||
    irMobile(order?.address?.phone) ||
    ''
  )
}

/**
 * After the order is confirmed: COD/installment at checkout, online after payment.
 * Template tokens: order id, delivery code, amount (toman).
 */
export async function notifyOrderPlaced(buyerOrderId: string) {
  try {
    const order = await Order.query().where('id', buyerOrderId).preload('user').first()
    if (!order || order.status === 'pending_payment' || order.status === 'cancelled') return

    const sellerOrders = await SellerOrder.query().where('buyerOrderId', order.id)
    if (!sellerOrders.length) return

    const phone = await buyerPhone(order, sellerOrders[0])
    if (!phone) {
      logger.warn({ orderId: order.id }, '[order-sms] no mobile for placed notice')
      return
    }

    const template = orderTemplate('KAVENEGAR_ORDER_PLACED_TEMPLATE', 'vitsell-order-placed')
    const orderToken = kavenegarLookupToken(order.id, '0')
    const amount = kavenegarLookupToken(String(Math.round(Number(order.total) || 0)), '0')
    const kavenegar = new KavenegarService()

    for (const seller of sellerOrders) {
      if (alreadySent(seller, PLACED_EVENT)) continue
      const delivery = kavenegarLookupToken(seller.deliveryCode || '', '')
      if (!delivery) {
        logger.warn({ sellerOrderId: seller.id }, '[order-sms] missing delivery code')
        continue
      }

      const result = await kavenegar.sendLookup(phone, template, {
        token: orderToken,
        token2: delivery,
        token3: amount,
      })
      if (!result.ok) continue

      pushTimeline(seller, PLACED_EVENT, 'سیستم', delivery)
      await seller.save()
    }
  } catch (error) {
    logger.error({ err: error, buyerOrderId }, '[order-sms] placed notice failed')
  }
}

/**
 * When the seller order is ready to ship (packing) or a tracking code is saved
 * while it is packing/shipped.
 * Template tokens: order id, tracking code, delivery code.
 * A later tracking code sends one more SMS if the previous one had no code.
 */
export async function notifyOrderReadyToShip(sellerOrId: SellerOrder | string) {
  const sellerOrderId = typeof sellerOrId === 'string' ? sellerOrId : sellerOrId.id
  try {
    const seller =
      typeof sellerOrId === 'string' ? await SellerOrder.find(sellerOrId) : sellerOrId
    if (!seller) return
    if (seller.status !== 'packing' && seller.status !== 'shipped') return

    const trackingToken = seller.trackingCode?.trim()
      ? kavenegarLookupToken(seller.trackingCode, MISSING_TRACKING)
      : MISSING_TRACKING
    if (alreadySent(seller, READY_EVENT, trackingToken)) return

    const buyer = seller.buyerOrderId
      ? await Order.query().where('id', seller.buyerOrderId).preload('user').first()
      : null
    if (buyer && (buyer.status === 'pending_payment' || buyer.status === 'cancelled')) return

    const phone = await buyerPhone(buyer, seller)
    if (!phone) {
      logger.warn({ sellerOrderId }, '[order-sms] no mobile for ready notice')
      return
    }

    const delivery = kavenegarLookupToken(seller.deliveryCode || '', '')
    if (!delivery) {
      logger.warn({ sellerOrderId }, '[order-sms] missing delivery code')
      return
    }

    const template = orderTemplate('KAVENEGAR_ORDER_READY_TEMPLATE', 'vitsell-order-ready')
    const result = await new KavenegarService().sendLookup(phone, template, {
      token: kavenegarLookupToken(buyer?.id || seller.id, '0'),
      token2: trackingToken,
      token3: delivery,
    })
    if (!result.ok) return

    pushTimeline(seller, READY_EVENT, 'سیستم', trackingToken)
    await seller.save()
  } catch (error) {
    logger.error({ err: error, sellerOrderId }, '[order-sms] ready notice failed')
  }
}
