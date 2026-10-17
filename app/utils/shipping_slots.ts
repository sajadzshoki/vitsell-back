import { DateTime } from 'luxon'
import SellerShippingMethod from '#models/seller_shipping_method'
import SellerShippingMethodCity from '#models/seller_shipping_method_city'
import SellerShippingWeekdaySlot from '#models/seller_shipping_weekday_slot'
import SellerShippingHolidaySlot from '#models/seller_shipping_holiday_slot'
import SellerShippingDayOverride from '#models/seller_shipping_day_override'
import ShippingSlotReservation from '#models/shipping_slot_reservation'
import Product from '#models/product'
import {
  iranWeekday,
  isFriday,
  loadHolidayDateSet,
  normalizeTime,
  parseTimeToMinutes,
  toDateKey,
} from '#utils/shipping_calendar'
import { moneyAmount } from '#utils/money'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type SlotDef = {
  startTime: string
  endTime: string
  capacity: number
  priceOverride: number | null
}

export type AvailabilitySlot = SlotDef & {
  reserved: number
  remaining: number
  full: boolean
  price: number
  selectable: boolean
}

export type AvailabilityDay = {
  date: string
  weekday: number
  isHoliday: boolean
  isFriday: boolean
  isClosed: boolean
  label: string
  slots: AvailabilitySlot[]
  hasSelectable: boolean
}

const WEEKDAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

function mapSlotRow(row: {
  startTime: string
  endTime: string
  capacity: number
  priceOverride: number | null
}): SlotDef {
  return {
    startTime: normalizeTime(row.startTime) || row.startTime,
    endTime: normalizeTime(row.endTime) || row.endTime,
    capacity: Math.max(0, Number(row.capacity) || 0),
    priceOverride: row.priceOverride == null ? null : Number(row.priceOverride),
  }
}

export async function findCityPrice(
  methodId: string,
  province: string,
  city: string
): Promise<SellerShippingMethodCity | null> {
  return SellerShippingMethodCity.query()
    .where('method_id', methodId)
    .where('province', province)
    .where('city', city)
    .where('active', true)
    .first()
}

export async function resolveMethodPrice(
  method: SellerShippingMethod,
  province?: string | null,
  city?: string | null
): Promise<{ ok: true, price: number } | { ok: false, reason: string }> {
  if (method.coverage !== 'cities') {
    return { ok: true, price: moneyAmount(method.baseCost) }
  }
  if (!province?.trim() || !city?.trim()) {
    return { ok: false, reason: 'برای این روش ارسال انتخاب شهر الزامی است' }
  }
  const row = await findCityPrice(method.id, province.trim(), city.trim())
  if (!row) {
    return { ok: false, reason: 'ارسال با این روش به شهر انتخاب‌شده ممکن نیست' }
  }
  return { ok: true, price: moneyAmount(row.price) }
}

async function loadReservationCounts(
  methodId: string,
  dateKeys: string[]
): Promise<Map<string, number>> {
  if (!dateKeys.length) return new Map()
  const rows = await ShippingSlotReservation.query()
    .where('method_id', methodId)
    .whereIn('slot_date', dateKeys)
    .whereIn('status', ['held', 'confirmed'])

  const map = new Map<string, number>()
  for (const row of rows) {
    const key = `${toDateKey(row.slotDate)}|${row.startTime}|${row.endTime}`
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

async function resolveSlotsForDate(
  method: SellerShippingMethod,
  date: DateTime,
  holidayDates: Set<string>,
  weekdaySlots: SellerShippingWeekdaySlot[],
  holidaySlots: SellerShippingHolidaySlot[],
  override: SellerShippingDayOverride | null
): Promise<{ closed: boolean, isHoliday: boolean, slots: SlotDef[] }> {
  const dateKey = toDateKey(date)
  const friday = isFriday(date)
  const calendarHoliday = holidayDates.has(dateKey)

  if (override?.isClosed && !override.useCustomSlots) {
    return { closed: true, isHoliday: true, slots: [] }
  }

  if (override?.useCustomSlots) {
    const custom = override.slots?.length
      ? override.slots
      : (
          await SellerShippingDayOverride.query()
            .where('id', override.id)
            .preload('slots', (q) => q.orderBy('sort_order', 'asc'))
            .first()
        )?.slots || []
    return {
      closed: false,
      isHoliday: friday || calendarHoliday,
      slots: custom.map(mapSlotRow),
    }
  }

  if (friday || calendarHoliday) {
    if (method.holidayMode === 'closed') {
      return { closed: true, isHoliday: true, slots: [] }
    }
    if (method.holidayMode === 'custom') {
      return {
        closed: holidaySlots.length === 0,
        isHoliday: true,
        slots: holidaySlots.map(mapSlotRow),
      }
    }
    // use_weekday: if Friday, no weekday template (جمعه empty); else use that weekday's slots
    if (friday) {
      return { closed: true, isHoliday: true, slots: [] }
    }
    const wd = iranWeekday(date)
    return {
      closed: false,
      isHoliday: true,
      slots: weekdaySlots.filter((s) => s.weekday === wd).map(mapSlotRow),
    }
  }

  const wd = iranWeekday(date)
  return {
    closed: false,
    isHoliday: false,
    slots: weekdaySlots.filter((s) => s.weekday === wd).map(mapSlotRow),
  }
}

export async function buildAvailability(
  method: SellerShippingMethod,
  opts: {
    province?: string | null
    city?: string | null
    basePrice: number
    days?: number
    now?: DateTime
    cartAllFastDelivery?: boolean
  }
): Promise<{
  methodId: string
  basePrice: number
  express: {
    enabled: boolean
    available: boolean
    price: number
    deadlineHour: number
  }
  days: AvailabilityDay[]
}> {
  const now = opts.now ?? DateTime.now().setZone('Asia/Tehran')
  const horizon = Math.min(14, Math.max(1, opts.days ?? 7))
  const start = now.startOf('day')
  const end = start.plus({ days: horizon - 1 })

  const [weekdaySlots, holidaySlots, overrides, holidayDates] = await Promise.all([
    SellerShippingWeekdaySlot.query()
      .where('method_id', method.id)
      .orderBy('weekday', 'asc')
      .orderBy('sort_order', 'asc'),
    SellerShippingHolidaySlot.query()
      .where('method_id', method.id)
      .orderBy('sort_order', 'asc'),
    SellerShippingDayOverride.query()
      .where('method_id', method.id)
      .where('date', '>=', start.toISODate()!)
      .where('date', '<=', end.toISODate()!)
      .preload('slots', (q) => q.orderBy('sort_order', 'asc')),
    loadHolidayDateSet(start, end),
  ])

  const overrideByDate = new Map(overrides.map((o) => [toDateKey(o.date), o]))
  const dateKeys = Array.from({ length: horizon }, (_, i) => toDateKey(start.plus({ days: i })))
  const reservedMap = await loadReservationCounts(method.id, dateKeys)

  const deadlineHour = Math.min(23, Math.max(0, Number(method.expressDeadlineHour) || 12))
  const expressPrice = moneyAmount(method.expressPrice)
  const beforeDeadline = now.hour < deadlineHour
  const expressAvailable =
    Boolean(method.expressEnabled)
    && Boolean(opts.cartAllFastDelivery)
    && beforeDeadline

  const days: AvailabilityDay[] = []

  for (let i = 0; i < horizon; i++) {
    const date = start.plus({ days: i })
    const dateKey = toDateKey(date)
    const wd = iranWeekday(date)
    const override = overrideByDate.get(dateKey) ?? null
    const resolved = await resolveSlotsForDate(
      method,
      date,
      holidayDates,
      weekdaySlots,
      holidaySlots,
      override
    )

    const slots: AvailabilitySlot[] = resolved.slots.map((slot) => {
      const key = `${dateKey}|${slot.startTime}|${slot.endTime}`
      const reserved = reservedMap.get(key) || 0
      const remaining = Math.max(0, slot.capacity - reserved)
      const full = remaining <= 0
      const price =
        slot.priceOverride != null ? moneyAmount(slot.priceOverride) : opts.basePrice

      // Past slots today are not selectable
      let past = false
      if (i === 0) {
        const endMin = parseTimeToMinutes(slot.endTime)
        const nowMin = now.hour * 60 + now.minute
        past = endMin >= 0 && nowMin >= endMin
      }

      return {
        ...slot,
        reserved,
        remaining,
        full,
        price,
        selectable: !resolved.closed && !full && !past,
      }
    })

    // Hide closed days with no slots from selectable list, but still return them
    // with isClosed so UI can skip. Full slots stay visible with full=true.
    days.push({
      date: dateKey,
      weekday: wd,
      isHoliday: resolved.isHoliday,
      isFriday: isFriday(date),
      isClosed: resolved.closed || slots.length === 0,
      label: WEEKDAY_LABELS[wd] || '',
      slots,
      hasSelectable: slots.some((s) => s.selectable),
    })
  }

  return {
    methodId: method.id,
    basePrice: opts.basePrice,
    express: {
      enabled: Boolean(method.expressEnabled),
      available: expressAvailable,
      price: expressPrice,
      deadlineHour,
    },
    days,
  }
}

export async function cartAllProductsFastDelivery(productIds: string[]): Promise<boolean> {
  if (!productIds.length) return false
  const products = await Product.query().whereIn('id', productIds)
  if (products.length !== productIds.length) return false
  return products.every((p) => Boolean(p.fastDelivery))
}

export async function validateSlotSelection(input: {
  method: SellerShippingMethod
  date: string
  startTime: string
  endTime: string
  isExpress: boolean
  basePrice: number
  cartAllFastDelivery: boolean
  now?: DateTime
}): Promise<{ ok: true, price: number, slot: SlotDef } | { ok: false, reason: string }> {
  const method = input.method
  if (!method.slotsEnabled) {
    return { ok: true, price: input.basePrice, slot: { startTime: '', endTime: '', capacity: 0, priceOverride: null } }
  }

  const start = normalizeTime(input.startTime)
  const end = normalizeTime(input.endTime)
  const date = DateTime.fromISO(input.date, { zone: 'Asia/Tehran' })
  if (!date.isValid || !start || !end) {
    return { ok: false, reason: 'بازه زمانی ارسال معتبر نیست' }
  }

  const now = input.now ?? DateTime.now().setZone('Asia/Tehran')
  const availability = await buildAvailability(method, {
    basePrice: input.basePrice,
    days: 7,
    now,
    cartAllFastDelivery: input.cartAllFastDelivery,
  })

  if (input.isExpress) {
    if (!availability.express.available) {
      return { ok: false, reason: 'ارسال سریع برای این سفارش در دسترس نیست' }
    }
    const today = availability.days.find((d) => d.date === toDateKey(now.startOf('day')))
    const slot = today?.slots.find((s) => s.startTime === start && s.endTime === end && s.selectable)
    if (!slot) {
      return { ok: false, reason: 'بازه ارسال سریع تکمیل شده یا نامعتبر است' }
    }
    return {
      ok: true,
      price: availability.express.price,
      slot: { startTime: start, endTime: end, capacity: slot.capacity, priceOverride: null },
    }
  }

  const day = availability.days.find((d) => d.date === input.date)
  if (!day || day.isClosed) {
    return { ok: false, reason: 'روز انتخاب‌شده برای ارسال در دسترس نیست' }
  }
  const slot = day.slots.find((s) => s.startTime === start && s.endTime === end)
  if (!slot) {
    return { ok: false, reason: 'بازه زمانی یافت نشد' }
  }
  if (!slot.selectable) {
    return { ok: false, reason: slot.full ? 'ظرفیت این بازه تکمیل شده است' : 'این بازه قابل انتخاب نیست' }
  }
  return {
    ok: true,
    price: slot.price,
    slot: {
      startTime: start,
      endTime: end,
      capacity: slot.capacity,
      priceOverride: slot.priceOverride,
    },
  }
}

export async function holdSlotReservation(input: {
  methodId: string
  orderId: string
  date: string
  startTime: string
  endTime: string
  isExpress: boolean
  status?: 'held' | 'confirmed'
  trx?: TransactionClientContract
}) {
  const start = normalizeTime(input.startTime)
  const end = normalizeTime(input.endTime)
  if (!start || !end || !input.date) return null

  return ShippingSlotReservation.create(
    {
      methodId: input.methodId,
      slotDate: DateTime.fromISO(input.date),
      startTime: start,
      endTime: end,
      orderId: input.orderId,
      status: input.status === 'confirmed' ? 'confirmed' : 'held',
      isExpress: Boolean(input.isExpress),
    },
    { client: input.trx }
  )
}

export async function confirmSlotReservation(
  orderId: string,
  trx?: TransactionClientContract
) {
  const q = ShippingSlotReservation.query()
  if (trx) q.useTransaction(trx)
  const row = await q.where('order_id', orderId).first()
  if (!row || row.status === 'released') return
  row.status = 'confirmed'
  if (trx) row.useTransaction(trx)
  await row.save()
}

export async function releaseSlotReservation(
  orderId: string,
  trx?: TransactionClientContract
) {
  const q = ShippingSlotReservation.query()
  if (trx) q.useTransaction(trx)
  const row = await q.where('order_id', orderId).first()
  if (!row || row.status === 'released') return
  row.status = 'released'
  if (trx) row.useTransaction(trx)
  await row.save()
}
