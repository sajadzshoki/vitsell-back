import User from '#models/user'
import Profile from '#models/profile'
import OtpService from '#services/otp_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { assertAdminPanelRequest, assertStorefrontRequest } from '#utils/auth_origins'
import {
  ensureSystemAdminRoles,
  expandRolePermissions,
  loadUserAdminRoles,
  syncUserAdminRoles,
} from '#utils/seller_admins'
import AdminRole from '#models/admin_role'
import { mapUserStatusToAdmin, publicRoleId } from '#utils/admin_rbac'
import { DateTime } from 'luxon'

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

async function ensureProfile(user: User) {
  await user.load('profile')
  if (!user.profile) {
    await Profile.create({
      userId: user.id,
      firstName: '',
      lastName: '',
      email: null,
      birth: null,
      gender: null,
      avatar: null,
    })
    await user.load('profile')
  }
  return user.profile!
}

async function adminProfilePayload(user: User) {
  const profile = await ensureProfile(user)
  if (user.role !== 'admin') {
    return profile.toAccountProfile(user.phone, user.hasPassword, user.role)
  }

  await ensureSystemAdminRoles()
  let roles = await loadUserAdminRoles(user)
  if (!roles.length) {
    const superRole = await AdminRole.findBy('key', 'SUPER_ADMIN')
    if (superRole) {
      await syncUserAdminRoles(user, [superRole])
      roles = await loadUserAdminRoles(user)
    }
  }

  const abilities = await expandRolePermissions(roles)
  const roleIds = roles.map((r) => publicRoleId(r.key))
  return profile.toAccountProfile(user.phone, user.hasPassword, user.role, {
    adminId: String(user.id),
    adminStatus: mapUserStatusToAdmin(user.status),
    roleIds,
    abilities,
    primaryRoleKey: roles[0]?.key || 'SUPER_ADMIN',
  })
}

function rejectAdminOnStore(user: User, response: HttpContext['response']) {
  if (user.role === 'admin') {
    response.forbidden({
      errors: [{ message: 'حساب مدیر از این مسیر قابل ورود نیست. از پنل ادمین استفاده کنید.' }],
    })
    return true
  }
  return false
}

export default class AuthController {
  /** ——— Storefront (customers) ——— */

  async checkPhone(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone } = await ctx.request.validateUsing(requestOtpValidator)
    const user = await User.query().where('phone', phone).first()
    if (user?.role === 'admin') {
      return ctx.response.ok({ hasPassword: false, isAdmin: true })
    }
    return ctx.response.ok({
      hasPassword: Boolean(user?.password),
      isAdmin: false,
    })
  }

  async requestOtp(ctx: HttpContext) {
    if (!assertStorefrontRequest(ctx)) return
    const { phone } = await ctx.request.validateUsing(requestOtpValidator)
    const existing = await User.query().where('phone', phone).first()
    if (existing?.role === 'admin') {
      return ctx.response.forbidden({
        errors: [{ message: 'حساب مدیر از فروشگاه قابل ورود نیست.' }],
      })
    }

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
    const { phone, code } = await ctx.request.validateUsing(verifyOtpValidator)
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

    let user = await User.query().where('phone', phone).first()
    if (user && rejectAdminOnStore(user, ctx.response)) return

    if (!user) {
      user = await User.create({ phone, role: 'customer', password: null })
    }

    const profile = await ensureProfile(user)
    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: profile.toAccountProfile(user.phone, user.hasPassword, user.role),
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

    if (rejectAdminOnStore(user, ctx.response)) return

    const valid = await user.verifyPassword(password)
    if (!valid) {
      return ctx.response.unauthorized({
        errors: [{ field: 'password', message: 'شماره موبایل یا رمز عبور نادرست است.' }],
      })
    }

    const profile = await ensureProfile(user)
    const token = await User.accessTokens.create(user)

    return ctx.response.ok({
      token: token.value!.release(),
      profile: profile.toAccountProfile(user.phone, user.hasPassword, user.role),
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
    if (rejectAdminOnStore(user, ctx.response)) return

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
      profile: await adminProfilePayload(user),
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.role === 'admin' && user.status !== 'active') {
      return response.forbidden({
        errors: [{ message: 'حساب مدیر غیرفعال یا معلق است' }],
      })
    }
    return response.ok(await adminProfilePayload(user))
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
    return response.ok({ message: 'خروج موفق' })
  }
}
