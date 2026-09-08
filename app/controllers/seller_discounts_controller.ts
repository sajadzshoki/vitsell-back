import StoreDiscount, {
  emptyStoreDiscountTargeting,
  type StoreDiscountStatus,
  type StoreDiscountType,
} from '#models/store_discount'
import {
  bulkDiscountDeleteValidator,
  bulkDiscountStatusValidator,
  discountStatusValidator,
  discountsQueryValidator,
  storeDiscountValidator,
  updateDiscountValidator,
} from '#validators/discount'
import { querySellerDiscounts } from '#utils/seller_discounts_query'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function parseDate(value: string) {
  const dt = DateTime.fromISO(value, { setZone: true })
  if (!dt.isValid) return null
  return dt.toUTC()
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value || !String(value).trim()) return null
  return parseDate(String(value))
}

function validateSchedule(
  startsAt: DateTime | null,
  endsAt: DateTime | null,
): { field: string, message: string } | null {
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { field: 'endsAt', message: 'پایان باید بعد از شروع باشد' }
  }
  return null
}

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'discount'
  )
}

function normalizeValue(type: StoreDiscountType, value: number) {
  if (type === 'percent') return Math.min(99, Math.max(1, Math.round(value) || 1))
  return Math.max(1, Math.round(value) || 1)
}

function normalizeTargeting(raw: any) {
  return {
    ...emptyStoreDiscountTargeting(),
    ...(raw && typeof raw === 'object' ? raw : {}),
    productIds: Array.isArray(raw?.productIds) ? raw.productIds.map(String) : [],
    categoryIds: Array.isArray(raw?.categoryIds) ? raw.categoryIds.map(String) : [],
    brandIds: Array.isArray(raw?.brandIds) ? raw.brandIds.map(String) : [],
    excludeProductIds: Array.isArray(raw?.excludeProductIds)
      ? raw.excludeProductIds.map(String)
      : [],
    excludeCategoryIds: Array.isArray(raw?.excludeCategoryIds)
      ? raw.excludeCategoryIds.map(String)
      : [],
    excludeBrandIds: Array.isArray(raw?.excludeBrandIds) ? raw.excludeBrandIds.map(String) : [],
  }
}

function optionalInt(value: number | null | undefined) {
  if (value == null) return null
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export default class SellerDiscountsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.type === 'all' || qs.type === '') delete qs.type
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await discountsQueryValidator.validate(qs)
    return response.ok(await querySellerDiscounts(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await StoreDiscount.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تخفیف یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeDiscountValidator)
    const id =
      payload.id?.trim() ||
      `disc-${slugify(payload.name)}-${Date.now().toString(36).slice(-4)}`

    const existing = await StoreDiscount.find(id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه تخفیف تکراری است' }],
      })
    }

    const startsAt = parseOptionalDate(payload.startsAt)
    const endsAt = parseOptionalDate(payload.endsAt)
    if (payload.startsAt && String(payload.startsAt).trim() && !startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (payload.endsAt && String(payload.endsAt).trim() && !endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    const scheduleError = validateSchedule(startsAt, endsAt)
    if (scheduleError) {
      return response.unprocessableEntity({ errors: [scheduleError] })
    }

    const type = payload.type as StoreDiscountType
    const row = await StoreDiscount.create({
      id,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      type,
      value: normalizeValue(type, payload.value),
      minOrder: Math.max(0, Math.round(payload.minOrder ?? 0)),
      maxDiscount: optionalInt(payload.maxDiscount),
      startsAt,
      endsAt,
      status: (payload.status ?? 'active') as StoreDiscountStatus,
      usageLimit: optionalInt(payload.usageLimit),
      usageCount: 0,
      perCustomerLimit: optionalInt(payload.perCustomerLimit),
      priority: Math.max(0, Math.round(payload.priority ?? 100)),
      targeting: normalizeTargeting(payload.targeting),
    })

    return response.created(row.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const row = await StoreDiscount.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تخفیف یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateDiscountValidator)
    const startsAt = parseOptionalDate(payload.startsAt)
    const endsAt = parseOptionalDate(payload.endsAt)
    if (payload.startsAt && String(payload.startsAt).trim() && !startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (payload.endsAt && String(payload.endsAt).trim() && !endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    const scheduleError = validateSchedule(startsAt, endsAt)
    if (scheduleError) {
      return response.unprocessableEntity({ errors: [scheduleError] })
    }

    const type = payload.type as StoreDiscountType
    row.merge({
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      type,
      value: normalizeValue(type, payload.value),
      minOrder: Math.max(0, Math.round(payload.minOrder ?? 0)),
      maxDiscount: optionalInt(payload.maxDiscount),
      startsAt,
      endsAt,
      status: (payload.status ?? row.status) as StoreDiscountStatus,
      usageLimit: optionalInt(payload.usageLimit),
      perCustomerLimit: optionalInt(payload.perCustomerLimit),
      priority: Math.max(0, Math.round(payload.priority ?? row.priority)),
      targeting: normalizeTargeting(payload.targeting ?? row.targeting),
    })
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async setStatus({ params, request, response }: HttpContext) {
    const row = await StoreDiscount.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تخفیف یافت نشد' }] })
    }
    const payload = await request.validateUsing(discountStatusValidator)
    row.status = payload.status
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async bulkStatus({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkDiscountStatusValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    const updated = await StoreDiscount.query().whereIn('id', ids).update({ status: payload.status })
    return response.ok({ updated: Number(updated) || ids.length, status: payload.status })
  }

  async bulkDestroy({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkDiscountDeleteValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    const deleted = await StoreDiscount.query().whereIn('id', ids).delete()
    return response.ok({ deleted: Number(deleted) || ids.length })
  }

  async destroy({ params, response }: HttpContext) {
    const row = await StoreDiscount.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تخفیف یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ ok: true })
  }
}
