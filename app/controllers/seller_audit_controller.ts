import type { HttpContext } from '@adonisjs/core/http'
import { auditQueryValidator, storeAuditValidator } from '#validators/audit'
import { parseAuditListQs, querySellerAudit } from '#utils/seller_audit_query'
import { recordAdminAudit } from '#utils/admin_audit'

export default class SellerAuditController {
  async index({ request, response }: HttpContext) {
    const filters = await auditQueryValidator.validate(parseAuditListQs({ ...request.qs() }))
    return response.ok(await querySellerAudit(filters))
  }

  /** Append-only create — used by FE overlays that still mutate client-side. */
  async store({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(storeAuditValidator)
    const row = await recordAdminAudit(actor, {
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId || '',
      summary: payload.summary,
      previousValue: payload.previousValue ?? null,
      newValue: payload.newValue ?? null,
    })
    if (!row) {
      return response.internalServerError({
        errors: [{ message: 'ثبت لاگ ناموفق بود' }],
      })
    }
    return response.created(row.toAdminJSON())
  }
}
