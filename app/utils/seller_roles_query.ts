import AdminRole from '#models/admin_role'
import type { RolesQuery } from '#validators/roles'
import { ensureSystemAdminRoles } from '#utils/seller_admins'
import { pageWindow, parseListQs } from '#utils/seller_schedule_filters'
import db from '@adonisjs/lucid/services/db'
import { parsePublicRoleId } from '#utils/admin_rbac'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type RoleQuery = ModelQueryBuilderContract<typeof AdminRole, AdminRole>

export function parseRolesListQs(qs: Record<string, any>) {
  return parseListQs(qs)
}

export async function findRoleByPublicId(id: string) {
  await ensureSystemAdminRoles()
  const key = parsePublicRoleId(id)
  if (!key) return null
  return AdminRole.findBy('key', key)
}

function applyRoleFilters(query: RoleQuery, filters: RolesQuery) {
  let q = query
  if (filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder.whereILike('key', like).orWhereILike('name', like).orWhereILike('description', like)
    })
  }
  return q
}

export async function querySellerRoles(filters: RolesQuery) {
  await ensureSystemAdminRoles()
  const { wantAll, page, pageSize } = pageWindow({
    ...filters,
    pageSize: filters.pageSize ?? 50,
  })

  const countRow = await applyRoleFilters(AdminRole.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const ordered = applyRoleFilters(AdminRole.query(), filters)
    .orderBy('is_system', 'desc')
    .orderBy('key', 'asc')

  const roles = wantAll
    ? await ordered.limit(pageSize)
    : await ordered.offset((page - 1) * pageSize).limit(pageSize)

  const counts = await db
    .from('admin_user_roles')
    .select('role_id')
    .count('* as total')
    .groupBy('role_id')
  const countMap = new Map<number, number>()
  for (const row of counts) {
    countMap.set(Number((row as any).role_id), Number((row as any).total) || 0)
  }

  const statusCounts = await countRoleStatusBuckets()

  return {
    items: roles.map((r) => r.toAdminJSON({ adminCount: countMap.get(r.id) || 0 })),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? roles.length : pageSize,
    statusCounts,
  }
}

async function countRoleStatusBuckets() {
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const [allRow, activeRow, inactiveRow] = await Promise.all([
    AdminRole.query().count('* as total').first(),
    AdminRole.query().where('status', 'active').count('* as total').first(),
    AdminRole.query().where('status', 'inactive').count('* as total').first(),
  ])
  return {
    all: num(allRow),
    active: num(activeRow),
    inactive: num(inactiveRow),
  }
}
