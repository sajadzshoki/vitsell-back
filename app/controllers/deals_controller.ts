import AmazingDeal from '#models/amazing_deal'
import Product from '#models/product'
import { dealsQueryValidator } from '#validators/deals_query'
import { querySellerDeals } from '#utils/seller_deals_query'
import { parseListQs } from '#utils/seller_schedule_filters'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const storeValidator = vine.compile(
  vine.object({
    id: idRule.clone().optional(),
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

const bulkStoreValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        productId: vine.string().trim().minLength(1),
        discountPercent: vine.number().min(1).max(99),
        startsAt: vine.string().trim(),
        endsAt: vine.string().trim(),
        active: vine.boolean().optional(),
      })
    ).minLength(1).maxLength(200),
  })
)

function parseDate(value: string) {
  const dt = DateTime.fromISO(value, { setZone: true })
  if (!dt.isValid) return null
  return dt.toUTC()
}

function makeDealId(productId: string) {
  const productSlug = productId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'item'
  return `deal-${productSlug}-${Date.now().toString(36).slice(-5)}-${Math.random().toString(36).slice(2, 5)}`
}

export default class DealsController {
  async index({ request, response }: HttpContext) {
    const filters = await dealsQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerDeals(filters))
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
    const product = await Product.find(payload.productId)
    if (!product) {
      return response.unprocessableEntity({
        errors: [{ field: 'productId', message: 'محصول یافت نشد' }],
      })
    }

    let id = payload.id?.trim() || makeDealId(payload.productId)
    if (await AmazingDeal.find(id)) {
      id = makeDealId(payload.productId)
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
      id,
      productId: payload.productId,
      discountPercent: Math.round(payload.discountPercent),
      startsAt,
      endsAt,
      active,
    })

    return response.created(deal.toAdminJSON())
  }

  async bulkStore({ request, response }: HttpContext) {
    const { items } = await request.validateUsing(bulkStoreValidator)
    const created: Record<string, unknown>[] = []
    const errors: { index: number, productId: string, message: string }[] = []
    const seenActive = new Set<string>()

    for (let index = 0; index < items.length; index++) {
      const row = items[index]!
      const productId = row.productId.trim()
      const product = await Product.find(productId)
      if (!product) {
        errors.push({ index, productId, message: 'محصول یافت نشد' })
        continue
      }

      const startsAt = parseDate(row.startsAt)
      const endsAt = parseDate(row.endsAt)
      if (!startsAt) {
        errors.push({ index, productId, message: 'زمان شروع نامعتبر است' })
        continue
      }
      if (!endsAt) {
        errors.push({ index, productId, message: 'زمان پایان نامعتبر است' })
        continue
      }
      if (endsAt <= startsAt) {
        errors.push({ index, productId, message: 'زمان پایان باید بعد از شروع باشد' })
        continue
      }

      const active = row.active ?? true
      if (active) {
        if (seenActive.has(productId)) {
          errors.push({ index, productId, message: 'در همین فایل بیش از یک شگفت‌انگیز فعال برای این محصول است' })
          continue
        }
        const clash = await AmazingDeal.query()
          .where('product_id', productId)
          .where('active', true)
          .first()
        if (clash) {
          errors.push({ index, productId, message: 'برای این محصول قبلاً شگفت‌انگیز فعال ثبت شده است' })
          continue
        }
        seenActive.add(productId)
      }

      try {
        const deal = await AmazingDeal.create({
          id: makeDealId(productId),
          productId,
          discountPercent: Math.round(row.discountPercent),
          startsAt,
          endsAt,
          active,
        })
        created.push(deal.toAdminJSON())
      }
      catch {
        errors.push({ index, productId, message: 'ثبت شگفت‌انگیز ناموفق بود' })
      }
    }

    return response.ok({
      created,
      errors,
      createdCount: created.length,
      errorCount: errors.length,
    })
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
