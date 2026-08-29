import Profile from '#models/profile'
import Address from '#models/address'
import Order from '#models/order'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const profileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim(),
    lastName: vine.string().trim(),
    email: vine.string().email().optional(),
    birth: vine.string().trim().optional(),
    gender: vine.string().trim().optional(),
  })
)

const addressValidator = vine.compile(
  vine.object({
    title: vine.string().trim(),
    fullName: vine.string().trim(),
    phone: vine.string().regex(/^09\d{9}$/),
    province: vine.string().trim(),
    city: vine.string().trim(),
    address: vine.string().trim(),
    postalCode: vine.string().trim().optional(),
    isDefault: vine.boolean().optional(),
  })
)

export default class AccountController {
  async showProfile({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('profile')
    if (!user.profile) {
      return response.notFound({ errors: [{ field: 'profile', message: 'پروفایل یافت نشد' }] })
    }
    return response.ok(user.profile.toAccountProfile(user.phone))
  }

  async updateProfile({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(profileValidator)
    let profile = await Profile.findBy('user_id', user.id)
    if (!profile) {
      profile = await Profile.create({
        userId: user.id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email ?? null,
        birth: payload.birth ?? null,
        gender: payload.gender ?? null,
      })
    } else {
      profile.merge({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email !== undefined ? (payload.email || null) : profile.email,
        birth: payload.birth !== undefined ? (payload.birth || null) : profile.birth,
        gender: payload.gender !== undefined ? (payload.gender || null) : profile.gender,
      })
      await profile.save()
    }
    return response.ok(profile.toAccountProfile(user.phone))
  }

  async addresses({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const list = await Address.query().where('user_id', user.id).orderBy('created_at', 'desc')
    return response.ok(list.map((a) => a.toJSON()))
  }

  async storeAddress({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(addressValidator)
    const isDefault = payload.isDefault ?? false

    if (isDefault) {
      await Address.query().where('user_id', user.id).update({ isDefault: false })
    }

    const address = await Address.create({
      id: `a${Date.now()}`,
      userId: user.id,
      title: payload.title,
      fullName: payload.fullName,
      phone: payload.phone,
      province: payload.province,
      city: payload.city,
      address: payload.address,
      postalCode: payload.postalCode ?? '',
      isDefault,
    })

    return response.created(address.toJSON())
  }

  async updateAddress({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await Address.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .first()
    if (!address) {
      return response.notFound({ errors: [{ field: 'id', message: 'آدرس یافت نشد' }] })
    }

    const payload = await request.validateUsing(addressValidator)
    if (payload.isDefault) {
      await Address.query().where('user_id', user.id).update({ isDefault: false })
    }

    address.merge({
      title: payload.title,
      fullName: payload.fullName,
      phone: payload.phone,
      province: payload.province,
      city: payload.city,
      address: payload.address,
      postalCode: payload.postalCode ?? address.postalCode,
      isDefault: payload.isDefault ?? address.isDefault,
    })
    await address.save()
    return response.ok(address.toJSON())
  }

  async destroyAddress({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await Address.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .first()
    if (!address) {
      return response.notFound({ errors: [{ field: 'id', message: 'آدرس یافت نشد' }] })
    }
    await address.delete()
    return response.ok({ removed: true })
  }

  async orders({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const orders = await Order.query()
      .where('user_id', user.id)
      .whereNot('status', 'pending_payment')
      .orderBy('created_at', 'desc')
    return response.ok(orders.map((o) => o.toShopOrderJSON()))
  }

  async showOrder({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    return response.ok(order.toShopOrderJSON())
  }
}
