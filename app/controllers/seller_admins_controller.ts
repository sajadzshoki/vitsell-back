import User from '#models/user'
import Profile from '#models/profile'
import {
  adminStatusValidator,
  adminsQueryValidator,
  storeAdminValidator,
  updateAdminValidator,
} from '#validators/admins'
import { parseAdminsListQs, querySellerAdmins } from '#utils/seller_admins_query'
import {
  countActiveSuperAdmins,
  ensureSystemAdminRoles,
  resolveRolesByPublicIds,
  syncUserAdminRoles,
  toAdminStaffJSON,
} from '#utils/seller_admins'
import {
  isAdminAccessAllowed,
  mapAdminStatusToUser,
  mapUserStatusToAdmin,
  type AdminStaffStatus,
} from '#utils/admin_rbac'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { recordAdminAudit } from '#utils/admin_audit'

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

async function loadStaff(userId: number) {
  const user = await User.query()
    .where('id', userId)
    .where('role', 'admin')
    .preload('profile')
    .preload('adminRoles')
    .first()
  return user
}

function rolesIncludeSuper(roles: { key: string }[]) {
  return roles.some((r) => r.key === 'SUPER_ADMIN')
}

export default class SellerAdminsController {
  async index({ request, response }: HttpContext) {
    await ensureSystemAdminRoles()
    const filters = await adminsQueryValidator.validate(parseAdminsListQs({ ...request.qs() }))
    return response.ok(await querySellerAdmins(filters))
  }

  async show({ params, response }: HttpContext) {
    const user = await loadStaff(Number(params.id))
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'ادمین یافت نشد' }] })
    }
    const profile = await ensureProfile(user)
    return response.ok(toAdminStaffJSON(user, profile, user.adminRoles || []))
  }

  async store({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(storeAdminValidator)
    const roles = await resolveRolesByPublicIds(payload.roleIds)
    if (!roles.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'roleIds', message: 'نقش معتبر انتخاب نشده است' }],
      })
    }
    if (roles.some((r) => r.status === 'inactive')) {
      return response.unprocessableEntity({
        errors: [{ field: 'roleIds', message: 'نقش غیرفعال قابل اختصاص نیست' }],
      })
    }

    const phone = payload.phone.trim()
    const email = payload.email.trim().toLowerCase()
    const existing = await User.findBy('phone', phone)
    if (existing?.role === 'admin') {
      return response.conflict({
        errors: [{ field: 'phone', message: 'این شماره قبلاً به‌عنوان ادمین ثبت شده است' }],
      })
    }

    const emailQuery = Profile.query().whereILike('email', email)
    if (existing) emailQuery.whereNot('user_id', existing.id)
    const emailTaken = await emailQuery.first()
    if (emailTaken) {
      return response.conflict({
        errors: [{ field: 'email', message: 'ایمیل تکراری است' }],
      })
    }

    const status = mapAdminStatusToUser((payload.status || 'active') as AdminStaffStatus)
    let user: User
    if (existing) {
      existing.role = 'admin'
      existing.password = payload.password
      existing.status = status
      await existing.save()
      user = existing
    } else {
      user = await User.create({
        phone,
        role: 'admin',
        password: payload.password,
        status,
      })
    }

    const profile = await ensureProfile(user)
    profile.firstName = payload.firstName.trim()
    profile.lastName = payload.lastName.trim()
    profile.email = email
    profile.avatar = payload.avatar?.trim() || null
    await profile.save()

    await syncUserAdminRoles(user, roles)
    await user.load('adminRoles')

    await recordAdminAudit(actor, {
      action: 'create',
      entity: 'admin',
      entityId: user.id,
      summary: 'کاربر ادمین جدید افزوده شد',
      newValue: `${profile.firstName} ${profile.lastName}`.trim() || user.phone,
    })

    return response.created(toAdminStaffJSON(user, profile, user.adminRoles || []))
  }

  async update({ params, auth, request, response }: HttpContext) {
    const user = await loadStaff(Number(params.id))
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'ادمین یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateAdminValidator)
    const actor = auth.getUserOrFail()
    const roles = await resolveRolesByPublicIds(payload.roleIds)
    if (!roles.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'roleIds', message: 'نقش معتبر انتخاب نشده است' }],
      })
    }

    const profile = await ensureProfile(user)
    const nextStatus = (payload.status || mapUserStatusToAdmin(user.status)) as AdminStaffStatus
    const wasSuper =
      rolesIncludeSuper(user.adminRoles || []) && isAdminAccessAllowed(mapUserStatusToAdmin(user.status))
    const willBeSuper = rolesIncludeSuper(roles) && isAdminAccessAllowed(nextStatus)

    if (wasSuper && !willBeSuper && (await countActiveSuperAdmins(user.id)) === 0) {
      return response.conflict({
        errors: [{ message: 'نمی‌توان آخرین سوپر ادمین فعال را حذف یا غیرفعال کرد' }],
      })
    }

    if (actor.id === user.id) {
      if (!isAdminAccessAllowed(nextStatus)) {
        return response.conflict({
          errors: [{ message: 'نمی‌توانید وضعیت حساب خود را غیرفعال یا معلق کنید' }],
        })
      }
      if (wasSuper && !rolesIncludeSuper(roles) && (await countActiveSuperAdmins(user.id)) === 0) {
        return response.conflict({
          errors: [{ message: 'نمی‌توانید تنها نقش سوپر ادمین خود را حذف کنید' }],
        })
      }
    }

    const email = payload.email.trim().toLowerCase()
    const emailTaken = await Profile.query()
      .whereILike('email', email)
      .whereNot('user_id', user.id)
      .first()
    if (emailTaken) {
      return response.conflict({
        errors: [{ field: 'email', message: 'ایمیل تکراری است' }],
      })
    }

    if (payload.phone !== user.phone) {
      const phoneTaken = await User.findBy('phone', payload.phone)
      if (phoneTaken && phoneTaken.id !== user.id) {
        return response.conflict({
          errors: [{ field: 'phone', message: 'شماره تلفن تکراری است' }],
        })
      }
      user.phone = payload.phone
    }

    user.status = mapAdminStatusToUser(nextStatus)
    if (payload.password) {
      user.password = payload.password
    }
    await user.save()

    profile.firstName = payload.firstName.trim()
    profile.lastName = payload.lastName.trim()
    profile.email = email
    if (payload.avatar !== undefined) {
      profile.avatar = payload.avatar?.trim() || null
    }
    await profile.save()

    await syncUserAdminRoles(user, roles)
    await user.load('adminRoles')

    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'admin',
      entityId: user.id,
      summary: 'اطلاعات ادمین به‌روزرسانی شد',
      newValue: `${profile.firstName} ${profile.lastName}`.trim() || user.phone,
    })

    return response.ok(toAdminStaffJSON(user, profile, user.adminRoles || []))
  }

  async setStatus({ params, auth, request, response }: HttpContext) {
    const user = await loadStaff(Number(params.id))
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'ادمین یافت نشد' }] })
    }
    const { status } = await request.validateUsing(adminStatusValidator)
    const actor = auth.getUserOrFail()
    const profile = await ensureProfile(user)
    const wasSuper =
      rolesIncludeSuper(user.adminRoles || []) && isAdminAccessAllowed(mapUserStatusToAdmin(user.status))

    if (actor.id === user.id && !isAdminAccessAllowed(status)) {
      return response.conflict({
        errors: [{ message: 'نمی‌توانید وضعیت حساب خود را غیرفعال یا معلق کنید' }],
      })
    }
    if (wasSuper && !isAdminAccessAllowed(status) && (await countActiveSuperAdmins(user.id)) === 0) {
      return response.conflict({
        errors: [{ message: 'نمی‌توان آخرین سوپر ادمین فعال را غیرفعال کرد' }],
      })
    }

    const previous = mapUserStatusToAdmin(user.status)
    user.status = mapAdminStatusToUser(status)
    await user.save()
    await recordAdminAudit(actor, {
      action: 'status_change',
      entity: 'admin',
      entityId: user.id,
      summary: 'وضعیت ادمین تغییر کرد',
      previousValue: previous,
      newValue: status,
    })
    return response.ok(toAdminStaffJSON(user, profile, user.adminRoles || []))
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = await loadStaff(Number(params.id))
    if (!user) {
      return response.notFound({ errors: [{ field: 'id', message: 'ادمین یافت نشد' }] })
    }
    const actor = auth.getUserOrFail()
    if (actor.id === user.id) {
      return response.conflict({
        errors: [{ message: 'نمی‌توانید حساب خود را حذف کنید' }],
      })
    }
    const wasSuper =
      rolesIncludeSuper(user.adminRoles || []) && isAdminAccessAllowed(mapUserStatusToAdmin(user.status))
    if (wasSuper && (await countActiveSuperAdmins(user.id)) === 0) {
      return response.conflict({
        errors: [{ message: 'نمی‌توان آخرین سوپر ادمین را حذف کرد' }],
      })
    }

    user.status = 'inactive'
    await user.save()
    const profile = await ensureProfile(user)
    await recordAdminAudit(actor, {
      action: 'delete',
      entity: 'admin',
      entityId: user.id,
      summary: 'ادمین غیرفعال/حذف شد',
      newValue: 'inactive',
    })
    return response.ok(toAdminStaffJSON(user, profile, user.adminRoles || []))
  }
}

void DateTime
