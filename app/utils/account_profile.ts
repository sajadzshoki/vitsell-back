import Profile from '#models/profile'
import User from '#models/user'
import AdminRole from '#models/admin_role'
import { mapUserStatusToAdmin, publicRoleId } from '#utils/admin_rbac'
import {
  ensureSystemAdminRoles,
  expandRolePermissions,
  loadUserAdminRoles,
  syncUserAdminRoles,
} from '#utils/seller_admins'
import { isActiveCourier } from '#utils/courier'

export async function ensureProfile(user: User) {
  const existing = await Profile.findBy('user_id', user.id)
  if (existing) {
    user.$setRelated('profile', existing)
    return existing
  }

  const created = await Profile.create({
    userId: user.id,
    firstName: '',
    lastName: '',
    email: null,
    birth: null,
    gender: null,
    avatar: null,
  })
  user.$setRelated('profile', created)
  return created
}

/** Same shape as login /auth/me — includes RBAC fields for admins. */
export async function accountProfilePayload(user: User) {
  const profile = await ensureProfile(user)
  if (user.role !== 'admin') {
    return profile.toAccountProfile(user.phone, user.hasPassword, user.role, {
      isCourier: isActiveCourier(user),
    })
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
    isCourier: isActiveCourier(user),
  })
}
