import User from '#models/user'
import Profile from '#models/profile'
import {
  bulkCustomerStatusValidator,
  customersQueryValidator,
  updateCustomerStatusValidator,
  updateCustomerValidator,
} from '#validators/customers'
import {
  getSellerCustomerDetail,
  parseCustomerId,
  querySellerCustomers,
} from '#utils/seller_customers_query'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerCustomersController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    if (qs.sort === '') delete qs.sort
    for (const key of ['page', 'pageSize', 'spendMin', 'spendMax'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    for (const key of ['hasOrders', 'all'] as const) {
      if (qs[key] === '1' || qs[key] === 'true') qs[key] = true
      else if (qs[key] === '0' || qs[key] === 'false' || qs[key] === '') delete qs[key]
    }

    const filters = await customersQueryValidator.validate(qs)
    return response.ok(await querySellerCustomers(filters))
  }

  async show({ params, response }: HttpContext) {
    const userId = parseCustomerId(params.id)
    if (!userId) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }
    const detail = await getSellerCustomerDetail(userId)
    if (!detail) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }
    return response.ok(detail)
  }

  async update({ params, request, response }: HttpContext) {
    const userId = parseCustomerId(params.id)
    if (!userId) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }

    const user = await User.query().where('id', userId).where('role', 'customer').first()
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateCustomerValidator)

    if (payload.phone != null) {
      const phone = payload.phone.trim()
      const dup = await User.query().where('phone', phone).whereNot('id', user.id).first()
      if (dup) {
        return response.conflict({
          errors: [{ field: 'phone', message: 'این شماره قبلاً ثبت شده است' }],
        })
      }
      user.phone = phone
    }
    if (payload.status != null) {
      ;(user as any).status = payload.status
    }
    await user.save()

    let profile = await Profile.query().where('userId', user.id).first()
    if (!profile) {
      profile = await Profile.create({
        userId: user.id,
        firstName: payload.firstName?.trim() || 'مشتری',
        lastName: payload.lastName?.trim() || '',
        email: payload.email?.trim() || null,
        birth: null,
        gender: null,
      })
    } else {
      if (payload.firstName != null) profile.firstName = payload.firstName.trim()
      if (payload.lastName != null) profile.lastName = payload.lastName.trim()
      if (payload.email !== undefined) {
        profile.email = payload.email?.trim() ? payload.email.trim() : null
      }
      await profile.save()
    }

    const detail = await getSellerCustomerDetail(user.id)
    return response.ok(detail)
  }

  async setStatus({ params, request, response }: HttpContext) {
    const userId = parseCustomerId(params.id)
    if (!userId) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }

    const user = await User.query().where('id', userId).where('role', 'customer').first()
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'مشتری یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateCustomerStatusValidator)
    ;(user as any).status = payload.status
    await user.save()

    const detail = await getSellerCustomerDetail(user.id)
    return response.ok(detail)
  }

  async bulkStatus({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkCustomerStatusValidator)
    const ids = payload.ids
      .map((id) => parseCustomerId(id))
      .filter((id): id is number => id != null)

    if (!ids.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'ids', message: 'شناسه مشتری معتبر نیست' }],
      })
    }

    await User.query()
      .whereIn('id', ids)
      .where('role', 'customer')
      .update({ status: payload.status })

    return response.ok({
      updated: ids.length,
      status: payload.status,
    })
  }
}
