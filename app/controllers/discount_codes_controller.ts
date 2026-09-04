import DiscountCode from '#models/discount_code'
import Order from '#models/order'
import { discountCodesQueryValidator } from '#validators/promotions_query'
import { querySellerDiscountCodes } from '#utils/seller_promotions_query'
import { parseListQs } from '#utils/seller_schedule_filters'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const codeRule = vine.string().trim().regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i)

const storeValidator = vine.compile(
  vine.object({
    code: codeRule.clone(),
    percent: vine.number().min(1).max(99),
    startsAt: vine.string().trim(),
    endsAt: vine.string().trim(),
    minAmount: vine.number().min(0).optional(),
    oncePerUser: vine.boolean().optional(),
    active: vine.boolean().optional(),
  })
)

const updateValidator = vine.compile(
  vine.object({
    percent: vine.number().min(1).max(99),
    startsAt: vine.string().trim(),
    endsAt: vine.string().trim(),
    minAmount: vine.number().min(0).optional(),
    oncePerUser: vine.boolean().optional(),
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

export default class DiscountCodesController {
  async index({ request, response }: HttpContext) {
    const filters = await discountCodesQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerDiscountCodes(filters))
  }

  async show({ params, response }: HttpContext) {
    const code = String(params.code ?? '').toUpperCase()
    const row = await DiscountCode.find(code)
    if (!row) {
      return response.notFound({ errors: [{ field: 'code', message: 'کد تخفیف یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const code = payload.code.trim().toUpperCase()
    const existing = await DiscountCode.find(code)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'code', message: 'این کد تخفیف از قبل وجود دارد' }],
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

    const row = await DiscountCode.create({
      code,
      percent: DiscountCode.ratioFromInt(payload.percent),
      startsAt,
      endsAt,
      minAmount: Math.max(0, Math.round(payload.minAmount ?? 0)),
      oncePerUser: payload.oncePerUser ?? false,
      active: payload.active ?? true,
    })

    return response.created(row.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const code = String(params.code ?? '').toUpperCase()
    const row = await DiscountCode.find(code)
    if (!row) {
      return response.notFound({ errors: [{ field: 'code', message: 'کد تخفیف یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateValidator)
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

    row.percent = DiscountCode.ratioFromInt(payload.percent)
    row.startsAt = startsAt
    row.endsAt = endsAt
    row.minAmount = Math.max(0, Math.round(payload.minAmount ?? row.minAmount ?? 0))
    row.oncePerUser = payload.oncePerUser ?? row.oncePerUser
    row.active = payload.active ?? row.active
    await row.save()

    return response.ok(row.toAdminJSON())
  }

  async setActive({ params, request, response }: HttpContext) {
    const code = String(params.code ?? '').toUpperCase()
    const row = await DiscountCode.find(code)
    if (!row) {
      return response.notFound({ errors: [{ field: 'code', message: 'کد تخفیف یافت نشد' }] })
    }

    const { active } = await request.validateUsing(activeValidator)
    row.active = active
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const code = String(params.code ?? '').toUpperCase()
    const row = await DiscountCode.find(code)
    if (!row) {
      return response.notFound({ errors: [{ field: 'code', message: 'کد تخفیف یافت نشد' }] })
    }

    const used = await Order.query().where('discount_code', code).first()
    if (used) {
      return response.conflict({
        errors: [
          {
            field: 'code',
            message: 'این کد در سفارش استفاده شده و قابل حذف نیست؛ غیرفعالش کنید',
          },
        ],
      })
    }

    await row.delete()
    return response.ok({ message: 'کد تخفیف حذف شد' })
  }
}
