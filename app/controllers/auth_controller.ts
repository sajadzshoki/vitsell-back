import User from '#models/user'
import Profile from '#models/profile'
import OtpService from '#services/otp_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

const phoneRule = vine.string().regex(/^09\d{9}$/)

const requestOtpValidator = vine.compile(
  vine.object({
    phone: phoneRule.clone(),
  })
)

const verifyOtpValidator = vine.compile(
  vine.object({
    phone: phoneRule.clone(),
    code: vine.string().fixedLength(5).regex(/^\d{5}$/),
  })
)

export default class AuthController {
  async requestOtp({ request, response }: HttpContext) {
    const { phone } = await request.validateUsing(requestOtpValidator)
    const otp = new OtpService()
    const result = await otp.request(phone)

    // Always return code when SMS is mocked (no Kavenegar key) or in non-production.
    const exposeDevCode =
      result.mocked || app.inDev || !env.get('KAVENEGAR_API_KEY')

    return response.ok({
      message: 'کد تأیید ارسال شد',
      expiresIn: result.expiresIn,
      ...(exposeDevCode ? { devCode: result.code } : {}),
    })
  }

  async verifyOtp({ request, response }: HttpContext) {
    const { phone, code } = await request.validateUsing(verifyOtpValidator)
    const otp = new OtpService()
    const result = await otp.verify(phone, code)

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'کد تأیید یافت نشد. دوباره درخواست کنید.',
        expired: 'کد تأیید منقضی شده است.',
        too_many: 'تعداد تلاش‌ها بیش از حد مجاز است.',
        invalid: 'کد تأیید نادرست است.',
      }
      return response.unprocessableEntity({
        errors: [{ field: 'code', message: messages[result.reason] }],
      })
    }

    let user = await User.query().where('phone', phone).preload('profile').first()
    if (!user) {
      user = await User.create({ phone, role: 'customer' })
      await Profile.create({
        userId: user.id,
        firstName: '',
        lastName: '',
        email: null,
        birth: null,
        gender: null,
      })
      await user.load('profile')
    } else if (!user.profile) {
      await Profile.create({
        userId: user.id,
        firstName: '',
        lastName: '',
        email: null,
        birth: null,
        gender: null,
      })
      await user.load('profile')
    }

    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token.value!.release(),
      profile: user.profile!.toAccountProfile(user.phone),
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('profile')
    if (!user.profile) {
      return response.notFound({ errors: [{ field: 'profile', message: 'پروفایل یافت نشد' }] })
    }
    return response.ok(user.profile.toAccountProfile(user.phone))
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
    return response.ok({ message: 'خروج موفق' })
  }
}
