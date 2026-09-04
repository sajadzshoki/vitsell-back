import AdminRole from '#models/admin_role'
import {
  rolesQueryValidator,
  storeRoleValidator,
  updateRoleValidator,
} from '#validators/roles'
import { ensureSystemAdminRoles } from '#utils/seller_admins'
import { findRoleByPublicId, parseRolesListQs, querySellerRoles } from '#utils/seller_roles_query'
import { SYSTEM_ROLE_META, publicRoleId } from '#utils/admin_rbac'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { recordAdminAudit } from '#utils/admin_audit'

export default class SellerRolesController {
  async index({ request, response }: HttpContext) {
    const filters = await rolesQueryValidator.validate(parseRolesListQs({ ...request.qs() }))
    return response.ok(await querySellerRoles(filters))
  }

  async show({ params, response }: HttpContext) {
    const role = await findRoleByPublicId(params.id)
    if (!role) {
      return response.notFound({ errors: [{ field: 'id', message: 'نقش یافت نشد' }] })
    }
    const countRow = await db
      .from('admin_user_roles')
      .where('role_id', role.id)
      .count('* as total')
      .first()
    const adminCount = Number((countRow as any)?.total ?? 0)
    return response.ok(role.toAdminJSON({ adminCount }))
  }

  async store({ auth, request, response }: HttpContext) {
    await ensureSystemAdminRoles()
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(storeRoleValidator)
    const key = payload.key.trim().toUpperCase()
    const existing = await AdminRole.findBy('key', key)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'key', message: 'کلید نقش تکراری است' }],
      })
    }

    const role = await AdminRole.create({
      key,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      isSystem: false,
      permissions: [...new Set(payload.permissions || [])],
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    })

    await recordAdminAudit(actor, {
      action: 'create',
      entity: 'role',
      entityId: publicRoleId(role.key),
      summary: 'نقش جدید ایجاد شد',
      newValue: role.key,
    })

    return response.created(role.toAdminJSON({ adminCount: 0 }))
  }

  async update({ params, auth, request, response }: HttpContext) {
    const role = await findRoleByPublicId(params.id)
    if (!role) {
      return response.notFound({ errors: [{ field: 'id', message: 'نقش یافت نشد' }] })
    }

    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(updateRoleValidator)
    const prevPerms = JSON.stringify(role.permissions || [])
    role.name = payload.name.trim()
    role.description = payload.description?.trim() || ''

    if (role.key === 'SUPER_ADMIN') {
      role.status = 'active'
      role.permissions = SYSTEM_ROLE_META.SUPER_ADMIN?.permissions || ['*']
    } else {
      if (payload.status) role.status = payload.status
      if (payload.permissions) role.permissions = [...new Set(payload.permissions)]
    }

    await role.save()
    const nextPerms = JSON.stringify(role.permissions || [])
    await recordAdminAudit(actor, {
      action: payload.permissions && prevPerms !== nextPerms ? 'permission_change' : 'update',
      entity: 'role',
      entityId: publicRoleId(role.key),
      summary: 'نقش به‌روزرسانی شد',
      previousValue: prevPerms !== nextPerms ? prevPerms : null,
      newValue: prevPerms !== nextPerms ? nextPerms : role.name,
    })
    const countRow = await db
      .from('admin_user_roles')
      .where('role_id', role.id)
      .count('* as total')
      .first()
    return response.ok(role.toAdminJSON({ adminCount: Number((countRow as any)?.total ?? 0) }))
  }

  async destroy({ params, auth, response }: HttpContext) {
    const role = await findRoleByPublicId(params.id)
    if (!role) {
      return response.notFound({ errors: [{ field: 'id', message: 'نقش یافت نشد' }] })
    }
    if (role.isSystem) {
      return response.conflict({
        errors: [{ message: 'نقش‌های سیستمی قابل حذف نیستند' }],
      })
    }
    const actor = auth.getUserOrFail()
    const countRow = await db
      .from('admin_user_roles')
      .where('role_id', role.id)
      .count('* as total')
      .first()
    const adminCount = Number((countRow as any)?.total ?? 0)
    if (adminCount > 0) {
      return response.conflict({
        errors: [{ message: 'نقش به ادمین اختصاص دارد؛ ابتدا کاربران را تغییر دهید' }],
      })
    }
    const publicId = publicRoleId(role.key)
    const key = role.key
    await role.delete()
    await recordAdminAudit(actor, {
      action: 'delete',
      entity: 'role',
      entityId: publicId,
      summary: 'نقش حذف شد',
      previousValue: key,
    })
    return response.ok({ message: 'نقش حذف شد' })
  }

  /** Static permission catalog keys used by FE editor */
  async permissions({ response }: HttpContext) {
    const keys = new Set<string>()
    for (const meta of Object.values(SYSTEM_ROLE_META)) {
      for (const p of meta.permissions) {
        if (p !== '*') keys.add(p)
      }
    }
    return response.ok({
      items: [...keys].sort(),
      groups: [],
    })
  }
}
