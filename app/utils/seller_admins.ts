import AdminRole from '#models/admin_role'
import User from '#models/user'
import {
  SYSTEM_ROLE_META,
  mapUserStatusToAdmin,
  publicRoleId,
  type AdminStaffStatus,
} from '#utils/admin_rbac'
import db from '@adonisjs/lucid/services/db'

export async function ensureSystemAdminRoles() {
  for (const [key, meta] of Object.entries(SYSTEM_ROLE_META)) {
    const existing = await AdminRole.findBy('key', key)
    if (existing) {
      if (key === 'SUPER_ADMIN' && (!existing.permissions?.length || existing.permissions.includes('*'))) {
        existing.permissions = ['*']
        existing.name = meta.name
        existing.description = meta.description
        existing.isSystem = true
        existing.status = 'active'
        await existing.save()
      }
      continue
    }
    await AdminRole.create({
      key,
      name: meta.name,
      description: meta.description,
      isSystem: true,
      permissions: meta.permissions,
      status: 'active',
    })
  }
}

export async function resolveRolesByPublicIds(roleIds: string[]) {
  await ensureSystemAdminRoles()
  const keys = roleIds
    .map((id) => {
      const raw = String(id || '').trim()
      if (!raw) return null
      if (raw.startsWith('role-')) return raw.slice(5).toUpperCase()
      return raw.toUpperCase()
    })
    .filter(Boolean) as string[]

  if (!keys.length) return [] as AdminRole[]
  return AdminRole.query().whereIn('key', keys)
}

export async function adminHasPermission(user: User, permission: string) {
  await ensureSystemAdminRoles()
  const roles = await loadUserAdminRoles(user)
  const abilities = await expandRolePermissions(roles)
  return abilities.includes('*') || abilities.includes(permission)
}

export async function expandRolePermissions(roles: AdminRole[]) {
  const set = new Set<string>()
  for (const role of roles) {
    if (role.status === 'inactive') continue
    for (const p of role.permissions || []) {
      if (p === '*') {
        // Super: FE expands sellerAllPermissions; mark with special token
        set.add('*')
        continue
      }
      set.add(p)
    }
  }
  return [...set]
}

export async function loadUserAdminRoles(user: User) {
  await user.load('adminRoles')
  return user.adminRoles || []
}

export async function syncUserAdminRoles(user: User, roles: AdminRole[]) {
  await user.related('adminRoles').sync(roles.map((r) => r.id))
}

export function toAdminStaffJSON(
  user: User,
  profile: { firstName: string; lastName: string; email: string | null; avatar?: string | null },
  roles: AdminRole[],
) {
  const status = mapUserStatusToAdmin(user.status)
  const roleIds = roles.map((r) => publicRoleId(r.key))
  const primary = roles[0]
  return {
    id: String(user.id),
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: user.phone,
    avatar: profile.avatar || null,
    status,
    roleIds,
    primaryRoleKey: primary?.key || 'VIEWER',
    createdAt: user.createdAt?.toISO() ?? null,
    lastLoginAt: user.lastLoginAt?.toISO() ?? null,
    lastActivityAt: user.updatedAt?.toISO() ?? null,
    hasPassword: Boolean(user.password),
  }
}

export async function countActiveSuperAdmins(excludeUserId?: number) {
  await ensureSystemAdminRoles()
  const superRole = await AdminRole.findBy('key', 'SUPER_ADMIN')
  if (!superRole) return 0

  let q = db
    .from('admin_user_roles')
    .join('users', 'users.id', 'admin_user_roles.user_id')
    .where('admin_user_roles.role_id', superRole.id)
    .where('users.role', 'admin')
    .where('users.status', 'active')

  if (excludeUserId != null) {
    q = q.whereNot('users.id', excludeUserId)
  }

  const row = await q.count('* as total').first()
  return Number((row as any)?.total ?? 0)
}

export function assertAdminStaffStatus(status: string): status is AdminStaffStatus {
  return status === 'active' || status === 'inactive' || status === 'suspended'
}
