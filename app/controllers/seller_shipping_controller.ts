import SellerShippingMethod from '#models/seller_shipping_method'
import SellerShippingMethodCity from '#models/seller_shipping_method_city'
import SellerShippingWeekdaySlot from '#models/seller_shipping_weekday_slot'
import SellerShippingHolidaySlot from '#models/seller_shipping_holiday_slot'
import SellerShippingDayOverride from '#models/seller_shipping_day_override'
import SellerShippingDaySlot from '#models/seller_shipping_day_slot'
import ShippingCalendarHoliday from '#models/shipping_calendar_holiday'
import {
  availabilityQueryValidator,
  calendarHolidayValidator,
  createShippingMethodValidator,
  dayOverrideValidator,
  publicShippingQueryValidator,
  replaceHolidaySlotsValidator,
  replaceWeekdaySlotsValidator,
  shippingCityValidator,
  shippingMethodsQueryValidator,
  updateShippingMethodValidator,
} from '#validators/shipping'
import {
  buildAvailability,
  cartAllProductsFastDelivery,
  resolveMethodPrice,
} from '#utils/shipping_slots'
import { listStorefrontMethodsForCity } from '#utils/checkout_shipping'
import { normalizeTime } from '#utils/shipping_calendar'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'

function slugifyIdPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'method'
}

function mapIncomingSlots(
  slots: Array<{
    startTime: string
    endTime: string
    capacity: number
    priceOverride?: number | null
    sortOrder?: number
  }>
) {
  return slots.map((slot, index) => {
    const start = normalizeTime(slot.startTime)
    const end = normalizeTime(slot.endTime)
    if (!start || !end) {
      throw new Error('invalid-slot-time')
    }
    return {
      startTime: start,
      endTime: end,
      capacity: Math.round(slot.capacity),
      priceOverride: slot.priceOverride == null ? null : Math.round(slot.priceOverride),
      sortOrder: slot.sortOrder != null ? Math.round(slot.sortOrder) : index + 1,
    }
  })
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

  async publicIndex({ request, response }: HttpContext) {
    const qs = await publicShippingQueryValidator.validate(request.qs())
    const items = await listStorefrontMethodsForCity(qs.province, qs.city)
    return response.ok({ items })
  }

  async availability({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method || method.status !== 'active') {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }

    const qs = await availabilityQueryValidator.validate(request.qs())
    const priced = await resolveMethodPrice(method, qs.province, qs.city)
    if (!priced.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'city', message: priced.reason }],
      })
    }

    const productIds = String(qs.productIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const allFast = productIds.length ? await cartAllProductsFastDelivery(productIds) : false

    const availability = await buildAvailability(method, {
      province: qs.province,
      city: qs.city,
      basePrice: priced.price,
      days: qs.days ?? 7,
      cartAllFastDelivery: allFast,
    })

    return response.ok(availability)
  }

  async show({ params, response }: HttpContext) {
    const row = await SellerShippingMethod.query()
      .where('id', params.id)
      .preload('cities', (q) => q.orderBy('province', 'asc').orderBy('city', 'asc'))
      .preload('weekdaySlots', (q) => q.orderBy('weekday', 'asc').orderBy('sort_order', 'asc'))
      .preload('holidaySlots', (q) => q.orderBy('sort_order', 'asc'))
      .first()
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createShippingMethodValidator)
    const name = payload.name.trim()
    const id = `ship-${slugifyIdPart(name)}-${randomBytes(3).toString('hex')}`

    const maxRow = await SellerShippingMethod.query().orderBy('sort_order', 'desc').first()
    const nextSort = (maxRow ? Number(maxRow.sortOrder) || 0 : 0) + 1

    const row = await SellerShippingMethod.create({
      id,
      name,
      carrier: (payload.carrier ?? '').trim(),
      estimatedDays: (payload.estimatedDays ?? '').trim(),
      baseCost: Math.round(payload.baseCost ?? 0),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: payload.sortOrder != null ? Math.round(payload.sortOrder) : nextSort,
      coverage: payload.coverage === 'cities' ? 'cities' : 'nationwide',
      slotsEnabled: Boolean(payload.slotsEnabled),
      holidayMode:
        payload.holidayMode === 'custom' || payload.holidayMode === 'closed'
          ? payload.holidayMode
          : 'use_weekday',
      expressEnabled: Boolean(payload.expressEnabled),
      expressPrice: Math.round(payload.expressPrice ?? 0),
      expressDeadlineHour:
        payload.expressDeadlineHour != null
          ? Math.min(23, Math.max(0, Math.round(payload.expressDeadlineHour)))
          : 12,
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
    if (payload.coverage != null) row.coverage = payload.coverage
    if (payload.slotsEnabled != null) row.slotsEnabled = payload.slotsEnabled
    if (payload.holidayMode != null) row.holidayMode = payload.holidayMode
    if (payload.expressEnabled != null) row.expressEnabled = payload.expressEnabled
    if (payload.expressPrice != null) row.expressPrice = Math.round(payload.expressPrice)
    if (payload.expressDeadlineHour != null) {
      row.expressDeadlineHour = Math.min(23, Math.max(0, Math.round(payload.expressDeadlineHour)))
    }
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

  // ——— Cities ———

  async listCities({ params, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const rows = await SellerShippingMethodCity.query()
      .where('method_id', method.id)
      .orderBy('province', 'asc')
      .orderBy('city', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()) })
  }

  async upsertCity({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const payload = await request.validateUsing(shippingCityValidator)
    const province = payload.province.trim()
    const city = payload.city.trim()
    let row = await SellerShippingMethodCity.query()
      .where('method_id', method.id)
      .where('province', province)
      .where('city', city)
      .first()
    if (row) {
      row.price = Math.round(payload.price)
      if (payload.active != null) row.active = payload.active
      await row.save()
    } else {
      row = await SellerShippingMethodCity.create({
        methodId: method.id,
        province,
        city,
        price: Math.round(payload.price),
        active: payload.active !== false,
      })
    }
    return response.ok(row.toJSON())
  }

  async destroyCity({ params, response }: HttpContext) {
    const row = await SellerShippingMethodCity.query()
      .where('method_id', params.id)
      .where('id', params.cityId)
      .first()
    if (!row) {
      return response.notFound({ errors: [{ field: 'cityId', message: 'شهر یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ id: row.id, deleted: true })
  }

  // ——— Weekday slots ———

  async listWeekdaySlots({ params, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const rows = await SellerShippingWeekdaySlot.query()
      .where('method_id', method.id)
      .orderBy('weekday', 'asc')
      .orderBy('sort_order', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()) })
  }

  async replaceWeekdaySlots({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const payload = await request.validateUsing(replaceWeekdaySlotsValidator)
    let mapped
    try {
      mapped = mapIncomingSlots(payload.slots)
    } catch {
      return response.unprocessableEntity({
        errors: [{ field: 'slots', message: 'ساعت بازه نامعتبر است' }],
      })
    }

    await db.transaction(async (trx) => {
      await SellerShippingWeekdaySlot.query({ client: trx })
        .where('method_id', method.id)
        .where('weekday', payload.weekday)
        .delete()
      for (const slot of mapped) {
        await SellerShippingWeekdaySlot.create(
          {
            methodId: method.id,
            weekday: payload.weekday,
            ...slot,
          },
          { client: trx }
        )
      }
    })

    const rows = await SellerShippingWeekdaySlot.query()
      .where('method_id', method.id)
      .where('weekday', payload.weekday)
      .orderBy('sort_order', 'asc')
    return response.ok({ weekday: payload.weekday, items: rows.map((r) => r.toJSON()) })
  }

  // ——— Holiday slots template ———

  async listHolidaySlots({ params, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const rows = await SellerShippingHolidaySlot.query()
      .where('method_id', method.id)
      .orderBy('sort_order', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()), holidayMode: method.holidayMode })
  }

  async replaceHolidaySlots({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const payload = await request.validateUsing(replaceHolidaySlotsValidator)
    let mapped
    try {
      mapped = mapIncomingSlots(payload.slots)
    } catch {
      return response.unprocessableEntity({
        errors: [{ field: 'slots', message: 'ساعت بازه نامعتبر است' }],
      })
    }

    await db.transaction(async (trx) => {
      await SellerShippingHolidaySlot.query({ client: trx }).where('method_id', method.id).delete()
      for (const slot of mapped) {
        await SellerShippingHolidaySlot.create(
          {
            methodId: method.id,
            ...slot,
          },
          { client: trx }
        )
      }
    })

    const rows = await SellerShippingHolidaySlot.query()
      .where('method_id', method.id)
      .orderBy('sort_order', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()) })
  }

  // ——— Day overrides ———

  async listDayOverrides({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const from = String(request.input('from') || DateTime.now().toISODate())
    const to = String(
      request.input('to') || DateTime.now().plus({ days: 30 }).toISODate()
    )
    const rows = await SellerShippingDayOverride.query()
      .where('method_id', method.id)
      .where('date', '>=', from)
      .where('date', '<=', to)
      .preload('slots', (q) => q.orderBy('sort_order', 'asc'))
      .orderBy('date', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()) })
  }

  async upsertDayOverride({ params, request, response }: HttpContext) {
    const method = await SellerShippingMethod.find(params.id)
    if (!method) {
      return response.notFound({ errors: [{ field: 'id', message: 'روش ارسال یافت نشد' }] })
    }
    const payload = await request.validateUsing(dayOverrideValidator)
    const date = DateTime.fromISO(payload.date)
    if (!date.isValid) {
      return response.unprocessableEntity({
        errors: [{ field: 'date', message: 'تاریخ نامعتبر است' }],
      })
    }

    let mapped: ReturnType<typeof mapIncomingSlots> = []
    if (payload.useCustomSlots && payload.slots) {
      try {
        mapped = mapIncomingSlots(payload.slots)
      } catch {
        return response.unprocessableEntity({
          errors: [{ field: 'slots', message: 'ساعت بازه نامعتبر است' }],
        })
      }
    } else if (payload.useCustomSlots && !payload.slots) {
      // Copy from weekday template for that date
      const luxonWd = date.weekday
      const iranWd = luxonWd === 6 ? 0 : luxonWd === 7 ? 1 : luxonWd + 1
      const template = await SellerShippingWeekdaySlot.query()
        .where('method_id', method.id)
        .where('weekday', iranWd)
        .orderBy('sort_order', 'asc')
      mapped = template.map((s, index) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: Number(s.capacity) || 0,
        priceOverride: s.priceOverride == null ? null : Number(s.priceOverride),
        sortOrder: Number(s.sortOrder) || index + 1,
      }))
    }

    const row = await db.transaction(async (trx) => {
      let override = await SellerShippingDayOverride.query({ client: trx })
        .where('method_id', method.id)
        .where('date', payload.date)
        .first()
      if (!override) {
        override = await SellerShippingDayOverride.create(
          {
            methodId: method.id,
            date,
            isClosed: Boolean(payload.isClosed),
            useCustomSlots: Boolean(payload.useCustomSlots),
          },
          { client: trx }
        )
      } else {
        if (payload.isClosed != null) override.isClosed = payload.isClosed
        if (payload.useCustomSlots != null) override.useCustomSlots = payload.useCustomSlots
        await override.useTransaction(trx).save()
      }

      if (override.useCustomSlots) {
        await SellerShippingDaySlot.query({ client: trx }).where('override_id', override.id).delete()
        for (const slot of mapped) {
          await SellerShippingDaySlot.create(
            {
              overrideId: override.id,
              ...slot,
            },
            { client: trx }
          )
        }
      } else {
        await SellerShippingDaySlot.query({ client: trx }).where('override_id', override.id).delete()
      }

      await override.load('slots', (q) => q.orderBy('sort_order', 'asc'))
      return override
    })

    return response.ok(row.toJSON())
  }

  async destroyDayOverride({ params, response }: HttpContext) {
    const row = await SellerShippingDayOverride.query()
      .where('method_id', params.id)
      .where('id', params.overrideId)
      .first()
    if (!row) {
      return response.notFound({ errors: [{ field: 'overrideId', message: 'بازنویسی یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ id: row.id, deleted: true })
  }

  // ——— Calendar holidays ———

  async listHolidays({ request, response }: HttpContext) {
    const from = String(request.input('from') || DateTime.now().startOf('year').toISODate())
    const to = String(request.input('to') || DateTime.now().endOf('year').plus({ years: 1 }).toISODate())
    const rows = await ShippingCalendarHoliday.query()
      .where('date', '>=', from)
      .where('date', '<=', to)
      .orderBy('date', 'asc')
    return response.ok({ items: rows.map((r) => r.toJSON()) })
  }

  async storeHoliday({ request, response }: HttpContext) {
    const payload = await request.validateUsing(calendarHolidayValidator)
    const date = DateTime.fromISO(payload.date)
    if (!date.isValid) {
      return response.unprocessableEntity({
        errors: [{ field: 'date', message: 'تاریخ نامعتبر است' }],
      })
    }
    const existing = await ShippingCalendarHoliday.query().where('date', payload.date).first()
    if (existing) {
      existing.title = (payload.title ?? existing.title).trim()
      existing.source = 'manual'
      await existing.save()
      return response.ok(existing.toJSON())
    }
    const row = await ShippingCalendarHoliday.create({
      date,
      title: (payload.title ?? 'تعطیل').trim(),
      source: 'manual',
    })
    return response.created(row.toJSON())
  }

  async destroyHoliday({ params, response }: HttpContext) {
    const row = await ShippingCalendarHoliday.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تعطیل یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ id: row.id, deleted: true })
  }
}
