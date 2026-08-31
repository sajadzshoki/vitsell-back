import AmazingDeal from '#models/amazing_deal'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const storeValidator = vine.compile(
  vine.object({
    id: idRule.clone(),
    productId: vine.string().trim().minLength(1),
    discountPercent: vine.number().min(1).max(99),
    startsAt: vine.string().trim(),
    endsAt: vine.string().trim(),
    active: vine.boolean().optional(),
  })
)

const updateValidator = vine.compile(
  vine.object({
    productId: vine.string().trim().minLength(1),
    discountPercent: vine.number().min(1).max(99),
    startsAt: vine.string().trim(),
    endsAt: vine.string().trim(),
    active: vine.boolean().optional(),
  })
)

const activeValidator = vine.compile(
  vine.object({
    active: vine.boolean(),
  })
)

function parseDate(value: string) {
  const dt = DateTime.fromISO(value, { setZone: true })
  if (!dt.isValid) return null
  return dt.toUTC()
}

export default class DealsController {
  async index({ response }: HttpContext) {
    const deals = await AmazingDeal.query().orderBy('created_at', 'desc')
    return response.ok(deals.map((d) => d.toAdminJSON()))
  }

  async show({ params, response }: HttpContext) {
    const deal = await AmazingDeal.find(params.id)
    if (!deal) {
      return response.notFound({ errors: [{ field: 'id', message: 'شگفت‌انگیز یافت نشد' }] })
    }
    return response.ok(deal.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const existing = await AmazingDeal.find(payload.id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه شگفت‌انگیز تکراری است' }],
      })
    }

    const product = await Product.find(payload.productId)
    if (!product) {
      return response.unprocessableEntity({
        errors: [{ field: 'productId', message: 'محصول یافت نشد' }],
      })
    }

    const startsAt = parseDate(payload.startsAt)
    const endsAt = parseDate(payload.endsAt)
    if (!startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (!endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    if (endsAt <= startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان باید بعد از شروع باشد' }],
      })
    }

    const active = payload.active ?? true
    if (active) {
      const clash = await AmazingDeal.query()
        .where('product_id', payload.productId)
        .where('active', true)
        .first()
      if (clash) {
        return response.conflict({
          errors: [
            {
              field: 'productId',
              message: 'برای این محصول قبلاً شگفت‌انگیز فعال ثبت شده است',
            },
          ],
        })
      }
    }

    const deal = await AmazingDeal.create({
      id: payload.id,
      productId: payload.productId,
      discountPercent: Math.round(payload.discountPercent),
      startsAt,
      endsAt,
      active,
    })

    return response.created(deal.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const deal = await AmazingDeal.find(params.id)
    if (!deal) {
      return response.notFound({ errors: [{ field: 'id', message: 'شگفت‌انگیز یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateValidator)
    const product = await Product.find(payload.productId)
    if (!product) {
      return response.unprocessableEntity({
        errors: [{ field: 'productId', message: 'محصول یافت نشد' }],
      })
    }

    const startsAt = parseDate(payload.startsAt)
    const endsAt = parseDate(payload.endsAt)
    if (!startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (!endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    if (endsAt <= startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان باید بعد از شروع باشد' }],
      })
    }

    const active = payload.active ?? deal.active
    if (active) {
      const clash = await AmazingDeal.query()
        .where('product_id', payload.productId)
        .where('active', true)
        .whereNot('id', deal.id)
        .first()
      if (clash) {
        return response.conflict({
          errors: [
            {
              field: 'productId',
              message: 'برای این محصول قبلاً شگفت‌انگیز فعال ثبت شده است',
            },
          ],
        })
      }
    }

    deal.productId = payload.productId
    deal.discountPercent = Math.round(payload.discountPercent)
    deal.startsAt = startsAt
    deal.endsAt = endsAt
    deal.active = active
    await deal.save()

    return response.ok(deal.toAdminJSON())
  }

  async setActive({ params, request, response }: HttpContext) {
    const deal = await AmazingDeal.find(params.id)
    if (!deal) {
      return response.notFound({ errors: [{ field: 'id', message: 'شگفت‌انگیز یافت نشد' }] })
    }

    const { active } = await request.validateUsing(activeValidator)
    if (active) {
      const clash = await AmazingDeal.query()
        .where('product_id', deal.productId)
        .where('active', true)
        .whereNot('id', deal.id)
        .first()
      if (clash) {
        return response.conflict({
          errors: [
            {
              field: 'productId',
              message: 'برای این محصول قبلاً شگفت‌انگیز فعال ثبت شده است',
            },
          ],
        })
      }
    }

    deal.active = active
    await deal.save()
    return response.ok(deal.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const deal = await AmazingDeal.find(params.id)
    if (!deal) {
      return response.notFound({ errors: [{ field: 'id', message: 'شگفت‌انگیز یافت نشد' }] })
    }
    await deal.delete()
    return response.ok({ message: 'شگفت‌انگیز حذف شد' })
  }
}
