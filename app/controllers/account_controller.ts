import Profile from '#models/profile'
import Address from '#models/address'
import { accountProfilePayload } from '#utils/account_profile'
import Order from '#models/order'
import ProductReview from '#models/product_review'
import ProductQuestion from '#models/product_question'
import { storeCustomerReturnValidator } from '#validators/returns'
import { createCustomerReturns, listCustomerReturns, ReturnRequestError } from '#utils/order_returns'
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

const passwordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(1).maxLength(72).optional(),
    password: vine.string().minLength(8).maxLength(72),
    passwordConfirmation: vine.string().minLength(8).maxLength(72).sameAs('password'),
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
    return response.ok(await accountProfilePayload(user))
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
    user.$setRelated('profile', profile)
    return response.ok(await accountProfilePayload(user))
  }

  async setPassword({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(passwordValidator)

    if (user.hasPassword) {
      if (!payload.currentPassword) {
        return response.unprocessableEntity({
          errors: [{ field: 'currentPassword', message: 'رمز عبور فعلی را وارد کنید.' }],
        })
      }
      const valid = await user.verifyPassword(payload.currentPassword)
      if (!valid) {
        return response.unprocessableEntity({
          errors: [{ field: 'currentPassword', message: 'رمز عبور فعلی نادرست است.' }],
        })
      }
    }

    const hadPassword = user.hasPassword
    user.password = payload.password
    await user.save()

    return response.ok({
      message: hadPassword ? 'رمز عبور به‌روز شد' : 'رمز عبور تنظیم شد',
      hasPassword: true,
    })
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
      .preload('sellerOrders')
      .orderBy('created_at', 'desc')
    return response.ok(
      orders.map((o) => {
        const seller = o.sellerOrders[0]
        return o.toShopOrderJSON({
          trackingCode: seller?.trackingCode,
          carrier: seller?.carrier,
          sellerStatus: seller?.status,
        })
      }),
    )
  }

  async showOrder({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .preload('sellerOrders')
      .first()
    if (!order) {
      return response.notFound({ errors: [{ field: 'id', message: 'سفارش یافت نشد' }] })
    }
    const seller = order.sellerOrders[0]
    return response.ok(
      order.toShopOrderJSON({
        trackingCode: seller?.trackingCode,
        carrier: seller?.carrier,
        sellerStatus: seller?.status,
      }),
    )
  }

  async postalTracking({ params, response }: HttpContext) {
    const id = String(params.id || '').trim()
    if (!id) {
      return response.badRequest({
        errors: [{ field: 'id', message: 'شماره پیگیری سفارش را وارد کنید' }],
      })
    }

    const order = await Order.query()
      .whereRaw('lower(id) = ?', [id.toLowerCase()])
      .preload('sellerOrders')
      .first()

    if (!order) {
      return response.notFound({
        errors: [{ field: 'id', message: 'سفارشی با این شماره پیدا نشد' }],
      })
    }

    const trackingCode = order.sellerOrders
      .map((row) => String(row.trackingCode || '').trim())
      .find(Boolean)

    if (!trackingCode) {
      return response.notFound({
        errors: [{ field: 'id', message: 'کد رهگیری پستی برای این سفارش هنوز ثبت نشده' }],
      })
    }

    return response.ok({ trackingCode })
  }

  async orderReturns({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      return response.ok(await listCustomerReturns(user, String(params.id)))
    } catch (err) {
      if (err instanceof ReturnRequestError) {
        return response.status(err.status).send({
          errors: [{ field: err.field, message: err.message }],
        })
      }
      throw err
    }
  }

  async storeOrderReturn({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(storeCustomerReturnValidator)
    try {
      const rows = await createCustomerReturns(user, String(params.id), payload)
      return response.created(rows)
    } catch (err) {
      if (err instanceof ReturnRequestError) {
        return response.status(err.status).send({
          errors: [{ field: err.field, message: err.message }],
        })
      }
      throw err
    }
  }

  async reviews({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const [reviews, questions] = await Promise.all([
      ProductReview.query()
        .where('user_id', user.id)
        .preload('product')
        .orderBy('created_at', 'desc'),
      ProductQuestion.query()
        .where('user_id', user.id)
        .preload('product')
        .orderBy('created_at', 'desc'),
    ])

    return response.ok({
      reviews: reviews.map((r) => r.toAccountJSON(r.product)),
      questions: questions.map((q) => q.toAccountJSON(q.product)),
    })
  }
}
