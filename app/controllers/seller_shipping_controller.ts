import SellerShippingMethod from '#models/seller_shipping_method'
import {
  createShippingMethodValidator,
  shippingMethodsQueryValidator,
  updateShippingMethodValidator,
} from '#validators/shipping'
import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'

function slugifyIdPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'method'
}

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

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createShippingMethodValidator)
    const name = payload.name.trim()
    const id = `ship-${slugifyIdPart(name)}-${randomBytes(3).toString('hex')}`

    const maxRow = await SellerShippingMethod.query()
      .orderBy('sort_order', 'desc')
      .first()
    const nextSort = (maxRow ? Number(maxRow.sortOrder) || 0 : 0) + 1

    const row = await SellerShippingMethod.create({
      id,
      name,
      carrier: (payload.carrier ?? '').trim(),
      estimatedDays: (payload.estimatedDays ?? '').trim(),
      baseCost: Math.round(payload.baseCost ?? 0),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: payload.sortOrder != null ? Math.round(payload.sortOrder) : nextSort,
    })

    return response.created(row.toAdminJSON())
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

  async destroy({ params, response }: HttpContext) {
    const row = await SellerShippingMethod.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ id: params.id, deleted: true })
  }
}
