import type { HttpContext } from '@adonisjs/core/http'
import {
  markDiscrepancyResolved,
  querySellerReconciliation,
  unmarkDiscrepancyResolved,
} from '#utils/seller_reconciliation'
import {
  reconciliationQueryValidator,
  resolveDiscrepancyValidator,
} from '#validators/reconciliation'

export default class SellerReconciliationController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['q', 'severity', 'status'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    const filters = await reconciliationQueryValidator.validate(qs)
    return response.ok(await querySellerReconciliation(filters))
  }

  async resolve({ request, response }: HttpContext) {
    const payload = await request.validateUsing(resolveDiscrepancyValidator)
    const result = await markDiscrepancyResolved(payload.id)
    if (!result.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'id', message: result.error }],
      })
    }
    return response.ok({
      ok: true,
      id: payload.id,
      reconciledIds: result.reconciledIds,
    })
  }

  async unresolve({ params, response }: HttpContext) {
    const id = String(params.id || '').trim()
    const result = await unmarkDiscrepancyResolved(id)
    if (!result.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'id', message: result.error }],
      })
    }
    return response.ok({
      ok: true,
      id,
      reconciledIds: result.reconciledIds,
    })
  }
}
