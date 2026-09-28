import User from '#models/user'
import { ensureProfile } from '#utils/account_profile'
import { adminHasPermission } from '#utils/seller_admins'
import {
  courierStatusValidator,
  storeCourierValidator,
  updateCourierValidator,
} from '#validators/couriers'
import type { HttpContext } from '@adonisjs/core/http'

function courierName(user: User) {
  const name = [user.profile?.firstName, user.profile?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
  return name || user.phone
}

function toCourierJSON(user: User) {
  return {
    id: user.id,
    name: courierName(user),
    phone: user.phone,
    status: user.status,
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
  return User.query().where('id', id).where('role', 'courier').preload('profile').first()
}

export default class SellerCouriersController {
  async index(ctx: HttpContext) {
    if (!(await denyUnlessOrdersUpdate(ctx))) return
    const status = String(ctx.request.qs().status || '').trim()
    const query = User.query().where('role', 'courier').preload('profile').orderBy('id', 'desc')
    if (status === 'active' || status === 'inactive' || status === 'blocked') {
      query.where('status', status)
    }
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
    const existing = await User.query().where('phone', payload.phone).first()
    if (existing) {
      return ctx.response.unprocessableEntity({
        errors: [{ field: 'phone', message: 'این شماره قبلاً ثبت شده است' }],
      })
    }

    const user = await User.create({
      phone: payload.phone,
      role: 'courier',
      status: 'active',
      password: null,
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
    const taken = await User.query().where('phone', payload.phone).whereNot('id', user.id).first()
    if (taken) {
      return ctx.response.unprocessableEntity({
        errors: [{ field: 'phone', message: 'این شماره قبلاً ثبت شده است' }],
      })
    }

    user.phone = payload.phone
    await user.save()
    const profile = await ensureProfile(user)
    profile.firstName = payload.name
    profile.lastName = ''
    await profile.save()
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
    user.status = status
    await user.save()
    return ctx.response.ok(toCourierJSON(user))
  }
}
