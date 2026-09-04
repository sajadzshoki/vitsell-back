import SellerShippingMethod from '#models/seller_shipping_method'
import {
  shippingMethodsQueryValidator,
  updateShippingMethodValidator,
} from '#validators/shipping'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerShippingController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q

    const filters = await shippingMethodsQueryValidator.validate(qs)
    let query = SellerShippingMethod.query().orderBy('sort_order', 'asc').orderBy('id', 'asc')

    if (filters.status && filters.status !== 'all') {
      query = query.where('status', filters.status)
    }
    const search = filters.q?.trim()
    if (search) {
      const like = `%${search}%`
      query = query.where((builder) => {
        builder
          .whereILike('id', like)
          .orWhereILike('name', like)
          .orWhereILike('carrier', like)
      })
    }

    const rows = await query
    return response.ok({
      items: rows.map((row) => row.toAdminJSON()),
      total: rows.length,
    })
  }

  async show({ params, response }: HttpContext) {
    const row = await SellerShippingMethod.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const row = await SellerShippingMethod.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateShippingMethodValidator)
    if (payload.name != null) row.name = payload.name.trim()
    if (payload.carrier != null) row.carrier = payload.carrier.trim()
    if (payload.estimatedDays != null) row.estimatedDays = payload.estimatedDays.trim()
    if (payload.baseCost != null) row.baseCost = Math.round(payload.baseCost)
    if (payload.status != null) row.status = payload.status
    if (payload.sortOrder != null) row.sortOrder = Math.round(payload.sortOrder)
    await row.save()

    return response.ok(row.toAdminJSON())
  }
}
