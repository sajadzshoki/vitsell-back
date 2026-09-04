import User from '#models/user'
import Profile from '#models/profile'
import type { AdminsQuery } from '#validators/admins'
import {
  ensureSystemAdminRoles,
  toAdminStaffJSON,
} from '#utils/seller_admins'
import { pageWindow, parseListQs } from '#utils/seller_schedule_filters'
import { parsePublicRoleId } from '#utils/admin_rbac'
import AdminRole from '#models/admin_role'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type UserQuery = ModelQueryBuilderContract<typeof User, User>

export function parseAdminsListQs(qs: Record<string, any>) {
  const next = parseListQs(qs)
  if (next.roleId === 'all' || next.roleId === '') delete next.roleId
  return next
}

function applyAdminFilters(query: UserQuery, filters: AdminsQuery, role?: AdminRole | null) {
  let q = query.where('role', 'admin')

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'suspended') q = q.where('status', 'blocked')
    else if (filters.status === 'inactive') q = q.where('status', 'inactive')
    else q = q.where('status', 'active')
  }

  if (role) {
    q = q.whereHas('adminRoles', (builder) => builder.where('admin_roles.id', role.id))
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('phone', like)
        .orWhereHas('profile', (pq) => {
          pq.whereILike('first_name', like)
            .orWhereILike('last_name', like)
            .orWhereILike('email', like)
        })
    })
  }

  return q
}

export async function querySellerAdmins(filters: AdminsQuery) {
  await ensureSystemAdminRoles()
  const { wantAll, page, pageSize } = pageWindow(filters)

  let role: AdminRole | null = null
  if (filters.roleId && filters.roleId !== 'all') {
    const key = parsePublicRoleId(filters.roleId)
    if (!key) return emptyPage(page, pageSize)
    role = await AdminRole.findBy('key', key)
    if (!role) return emptyPage(page, pageSize)
  }

  // Count without preload — Lucid cannot preload relations on aggregate rows
  const countRow = await applyAdminFilters(User.query(), filters, role).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const listQuery = applyAdminFilters(User.query(), filters, role)
    .preload('profile')
    .preload('adminRoles')
    .orderBy('id', 'desc')

  const users = wantAll
    ? await listQuery.limit(pageSize)
    : await listQuery.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countStatusBuckets()

  return {
    items: users.map((u) =>
      toAdminStaffJSON(u, u.profile || emptyProfile(), u.adminRoles || []),
    ),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? users.length : pageSize,
    statusCounts,
  }
}

async function countStatusBuckets() {
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const base = () => User.query().where('role', 'admin')
  const [allRow, activeRow, inactiveRow, suspendedRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('status', 'active').count('* as total').first(),
    base().where('status', 'inactive').count('* as total').first(),
    base().where('status', 'blocked').count('* as total').first(),
  ])
  return {
    all: num(allRow),
    active: num(activeRow),
    inactive: num(inactiveRow),
    suspended: num(suspendedRow),
  }
}

function emptyProfile(): Profile {
  return {
    firstName: '',
    lastName: '',
    email: null,
    avatar: null,
  } as Profile
}

function emptyPage(page: number, pageSize: number) {
  return {
    items: [] as ReturnType<typeof toAdminStaffJSON>[],
    total: 0,
    page,
    pageSize,
    statusCounts: { all: 0, active: 0, inactive: 0, suspended: 0 },
  }
}
