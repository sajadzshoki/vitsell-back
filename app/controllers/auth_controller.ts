import User from '#models/user'
import OtpService from '#services/otp_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { assertAdminPanelRequest, assertStorefrontRequest } from '#utils/auth_origins'
import { DateTime } from 'luxon'
import { accountProfilePayload, ensureProfile } from '#utils/account_profile'
import { isActiveCourier } from '#utils/courier'

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
    panel: vine.enum(['courier'] as const).optional(),
  })
)

const loginPasswordValidator = vine.compile(
  vine.object({
    phone: phoneRule.clone(),
    password: vine.string().minLength(1).maxLength(72),
  })
)

const resetPasswordValidator = vine.compile(
  vine.object({
    phone: phoneRule.clone(),
    code: vine.string().fixedLength(5).regex(/^\d{5}$/),
    password: vine.string().minLength(8).maxLength(72),
    passwordConfirmation: vine.string().minLength(8).maxLength(72).sameAs('password'),
  })
)

export default class AuthController {
  /** ——— Storefront (customers + admins shopping as customers) ——— */

  async checkPhone(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone } = await ctx.request.validateUsing(requestOtpValidator)
    const user = await User.query().where('phone', phone).first()
    return ctx.response.ok({
      hasPassword: Boolean(user?.password),
      isAdmin: user?.role === 'admin',
    })
  }

  async requestOtp(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone } = await ctx.request.validateUsing(requestOtpValidator)

    const otp = new OtpService()
    const result = await otp.request(phone)
    const exposeDevCode = result.mocked || app.inDev || !env.get('KAVENEGAR_API_KEY')

    return ctx.response.ok({
      message: 'کد تأیید ارسال شد',
      expiresIn: result.expiresIn,
      ...(exposeDevCode ? { devCode: result.code } : {}),
    })
  }

  async verifyOtp(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone, code, panel } = await ctx.request.validateUsing(verifyOtpValidator)
    const otp = new OtpService()
    const result = await otp.verify(phone, code)

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'کد تأیید یافت نشد. دوباره درخواست کنید.',
        expired: 'کد تأیید منقضی شده است.',
        too_many: 'تعداد تلاش‌ها بیش از حد مجاز است.',
        invalid: 'کد تأیید نادرست است.',
      }
      return ctx.response.unprocessableEntity({
        errors: [{ field: 'code', message: messages[result.reason] }],
      })
    }

    if (panel === 'courier') {
      const courier = await User.query().where('phone', phone).first()
      if (!courier || !isActiveCourier(courier)) {
        return ctx.response.forbidden({
          errors: [{ message: 'ورود به پنل پیک مجاز نیست.' }],
        })
      }
      const token = await User.accessTokens.create(courier)
      return ctx.response.ok({
        token: token.value!.release(),
        profile: await accountProfilePayload(courier),
      })
    }

    let user = await User.query().where('phone', phone).first()

    if (!user) {
      user = await User.create({ phone, role: 'customer', password: null })
    }

    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: await accountProfilePayload(user),
    })
  }

  async loginWithPassword(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone, password } = await ctx.request.validateUsing(loginPasswordValidator)
    const user = await User.query().where('phone', phone).first()

    if (!user || !user.password) {
      return ctx.response.unauthorized({
        errors: [
          {
            field: 'password',
            message: 'ورود با رمز عبور برای این شماره فعال نیست. از کد تأیید استفاده کنید.',
          },
        ],
      })
    }

    const valid = await user.verifyPassword(password)
    if (!valid) {
      return ctx.response.unauthorized({
        errors: [{ field: 'password', message: 'شماره موبایل یا رمز عبور نادرست است.' }],
      })
    }

    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: await accountProfilePayload(user),
    })
  }

  async resetPassword(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone, code, password } = await ctx.request.validateUsing(resetPasswordValidator)
    const otp = new OtpService()
    const result = await otp.verify(phone, code)

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'کد تأیید یافت نشد. دوباره درخواست کنید.',
        expired: 'کد تأیید منقضی شده است.',
        too_many: 'تعداد تلاش‌ها بیش از حد مجاز است.',
        invalid: 'کد تأیید نادرست است.',
      }
      return ctx.response.unprocessableEntity({
        errors: [{ field: 'code', message: messages[result.reason] }],
      })
    }

    const user = await User.query().where('phone', phone).first()
    if (!user) {
      return ctx.response.unprocessableEntity({
        errors: [{ field: 'phone', message: 'حساب کاربری یافت نشد.' }],
      })
    }

    user.password = password
    await user.save()

    const profile = await ensureProfile(user)
    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: profile.toAccountProfile(user.phone, true, user.role),
      message: 'رمز عبور با موفقیت تغییر کرد',
    })
  }

  /** ——— Admin panel (separate origin + password) ——— */

  async adminCheckPhone(ctx: HttpContext) {
    if (!assertAdminPanelRequest(ctx)) return
    const { phone } = await ctx.request.validateUsing(requestOtpValidator)
    const user = await User.query().where('phone', phone).where('role', 'admin').first()
    return ctx.response.ok({
      isAdmin: Boolean(user),
      hasPassword: Boolean(user?.password),
    })
  }

  async adminLogin(ctx: HttpContext) {
    if (!assertAdminPanelRequest(ctx)) return
    const { phone, password } = await ctx.request.validateUsing(loginPasswordValidator)
    const user = await User.query().where('phone', phone).first()

    if (!user || user.role !== 'admin' || !user.password) {
      return ctx.response.unauthorized({
        errors: [{ field: 'password', message: 'دسترسی مدیر یافت نشد یا رمز تنظیم نشده است.' }],
      })
    }

    if (user.status !== 'active') {
      return ctx.response.forbidden({
        errors: [{ message: 'حساب مدیر غیرفعال یا معلق است' }],
      })
    }

    const valid = await user.verifyPassword(password)
    if (!valid) {
      return ctx.response.unauthorized({
        errors: [{ field: 'password', message: 'شماره موبایل یا رمز عبور نادرست است.' }],
      })
    }

    user.lastLoginAt = DateTime.utc()
    await user.save()

    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: await accountProfilePayload(user),
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.role === 'admin' && user.status !== 'active') {
      return response.forbidden({
        errors: [{ message: 'حساب مدیر غیرفعال یا معلق است' }],
      })
    }
    return response.ok(await accountProfilePayload(user))
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
    return response.ok({ message: 'خروج موفق' })
  }
}
