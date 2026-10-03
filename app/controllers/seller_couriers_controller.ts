import User from '#models/user'
import { ensureProfile } from '#utils/account_profile'
import { adminHasPermission } from '#utils/seller_admins'
import {
  applyCourierRoster,
  courierDisplayName,
  isCourierUser,
} from '#utils/courier'
import {
  courierStatusValidator,
  storeCourierValidator,
  updateCourierValidator,
} from '#validators/couriers'
import type { HttpContext } from '@adonisjs/core/http'

function courierStatus(user: User): 'active' | 'inactive' {
  if (user.isCourier) return user.courierActive ? 'active' : 'inactive'
  return user.role === 'courier' && user.status === 'active' ? 'active' : 'inactive'
}

function toCourierJSON(user: User) {
  return {
    id: user.id,
    name: courierDisplayName(user),
    phone: user.phone,
    status: courierStatus(user),
    shopAccount: user.role !== 'courier',
  }
}

async function denyUnlessOrdersUpdate({ auth, response }: HttpContext) {
  const actor = auth.getUserOrFail()
  if (await adminHasPermission(actor, 'orders.update')) return true
  response.forbidden({
    errors: [{ message: 'دسترسی به‌روزرسانی سفارش لازم است' }],
  })
  return false
}

async function loadCourier(id: number) {
  if (!Number.isFinite(id)) return null
  return applyCourierRoster(User.query().where('id', id)).preload('profile').first()
}

function enableCourier(user: User, name: string) {
  user.isCourier = true
  user.courierActive = true
  user.courierName = name
}

export default class SellerCouriersController {
  async index(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const status = String(ctx.request.qs().status || '').trim()
    const query = applyCourierRoster(User.query()).preload('profile').orderBy('id', 'desc')
    if (status === 'active') query.where('courier_active', true)
    else if (status === 'inactive') query.where('courier_active', false)
    const rows = await query
    return ctx.response.ok({ items: rows.map(toCourierJSON) })
  }

  async show(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const user = await loadCourier(Number(ctx.params.id))
    if (!user) {
      return ctx.response.notFound({ errors: [{ field: 'id', message: 'پیک یافت نشد' }] })
    }
    return ctx.response.ok(toCourierJSON(user))
  }

  async store(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const payload = await ctx.request.validateUsing(storeCourierValidator)
    const existing = await User.query().where('phone', payload.phone).preload('profile').first()
    if (existing) {
      if (isCourierUser(existing)) {
        return ctx.response.unprocessableEntity({
          errors: [{ field: 'phone', message: 'این شماره قبلاً به‌عنوان پیک ثبت شده است' }],
        })
      }

      enableCourier(existing, payload.name)
      await existing.save()
      await existing.load('profile')
      return ctx.response.created(toCourierJSON(existing))
    }

    const user = await User.create({
      phone: payload.phone,
      role: 'customer',
      status: 'active',
      password: null,
      isCourier: true,
      courierActive: true,
      courierName: payload.name,
    })
    const profile = await ensureProfile(user)
    profile.firstName = payload.name
    profile.lastName = ''
    await profile.save()
    await user.load('profile')
    return ctx.response.created(toCourierJSON(user))
  }

  async update(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const user = await loadCourier(Number(ctx.params.id))
    if (!user) {
      return ctx.response.notFound({ errors: [{ field: 'id', message: 'پیک یافت نشد' }] })
    }
    const payload = await ctx.request.validateUsing(updateCourierValidator)
    if (payload.phone !== user.phone) {
      if (user.role !== 'courier') {
        return ctx.response.unprocessableEntity({
          errors: [{ field: 'phone', message: 'شماره این پیک همان شماره حساب فروشگاه است و قابل تغییر نیست' }],
        })
      }
      const taken = await User.query().where('phone', payload.phone).whereNot('id', user.id).first()
      if (taken) {
        return ctx.response.unprocessableEntity({
          errors: [{ field: 'phone', message: 'این شماره قبلاً ثبت شده است' }],
        })
      }
      user.phone = payload.phone
    }

    user.courierName = payload.name
    await user.save()
    if (user.role === 'courier') {
      const profile = await ensureProfile(user)
      profile.firstName = payload.name
      profile.lastName = ''
      await profile.save()
    }
    await user.load('profile')
    return ctx.response.ok(toCourierJSON(user))
  }

  async setStatus(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const user = await loadCourier(Number(ctx.params.id))
    if (!user) {
      return ctx.response.notFound({ errors: [{ field: 'id', message: 'پیک یافت نشد' }] })
    }
    const { status } = await ctx.request.validateUsing(courierStatusValidator)
    user.isCourier = true
    user.courierActive = status === 'active'
    await user.save()
    await user.load('profile')
    return ctx.response.ok(toCourierJSON(user))
  }
}
