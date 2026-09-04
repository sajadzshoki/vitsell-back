import SellerOrder from '#models/seller_order'
import SellerReturn, { SELLER_RETURN_TRANSITIONS } from '#models/seller_return'
import Product from '#models/product'
import {
  returnsQueryValidator,
  storeReturnValidator,
  updateReturnStatusValidator,
} from '#validators/returns'
import { querySellerReturns } from '#utils/seller_returns_query'
import { pushTimeline } from '#utils/seller_order_detail'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function nextReturnId() {
  return `RET-${Date.now().toString(36).toUpperCase()}`
}

export default class SellerReturnsController {
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

    const filters = await returnsQueryValidator.validate(qs)
    return response.ok(await querySellerReturns(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await SellerReturn.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'مرجوعی یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeReturnValidator)
    const order = await SellerOrder.find(payload.orderId.trim())
    if (!order) {
      return response.notFound({ errors: [{ field: 'orderId', message: 'سفارش یافت نشد' }] })
    }

    const items = []
    for (const item of payload.items) {
      const product = await Product.find(item.productId)
      items.push({
        productId: item.productId.trim(),
        productTitle: (item.productTitle || product?.title || item.productId).toString().trim(),
        variantLabel: item.variantLabel ?? null,
        sku: (item.sku || product?.sku || item.productId).toString().trim(),
        qty: Math.max(1, Math.round(item.qty)),
        unitPrice: Math.max(0, Math.round(item.unitPrice)),
      })
    }

    const row = await SellerReturn.create({
      id: nextReturnId(),
      orderId: order.id,
      customerId: (payload.customerId ?? '').toString().trim(),
      customerName: (payload.customerName || order.customerName).toString().trim(),
      status: 'requested',
      reason: payload.reason.trim(),
      adminNote: (payload.adminNote ?? '').toString().trim(),
      requestedAt: DateTime.now(),
      items,
    })

    pushTimeline(order, 'ثبت مرجوعی', 'ادمین', row.id)
    await order.save()

    return response.created(row.toAdminJSON())
  }

  async setStatus({ params, request, response }: HttpContext) {
    const row = await SellerReturn.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'مرجوعی یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateReturnStatusValidator)
    const allowed = SELLER_RETURN_TRANSITIONS[row.status] ?? []
    if (payload.status !== row.status && !allowed.includes(payload.status)) {
      return response.unprocessableEntity({
        errors: [{ field: 'status', message: 'تغییر وضعیت مرجوعی مجاز نیست' }],
      })
    }

    row.status = payload.status
    if (payload.adminNote != null) row.adminNote = payload.adminNote.trim()
    await row.save()

    const order = await SellerOrder.find(row.orderId)
    if (order) {
      if (['approved', 'received', 'processing', 'completed'].includes(payload.status)) {
        if (order.status !== 'returned' && order.status !== 'cancelled') {
          const previous = order.status
          order.status = 'returned'
          pushTimeline(order, 'مرجوعی سفارش', 'ادمین', `${previous} → returned (${row.id})`)
          await order.save()
        } else {
          pushTimeline(order, 'به‌روزرسانی مرجوعی', 'ادمین', `${row.id}: ${payload.status}`)
          await order.save()
        }
      } else if (payload.status === 'rejected' || payload.status === 'cancelled') {
        pushTimeline(order, 'رد/لغو مرجوعی', 'ادمین', `${row.id}: ${payload.status}`)
        await order.save()
      }
    }

    return response.ok(row.toAdminJSON())
  }
}
