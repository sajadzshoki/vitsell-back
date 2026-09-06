import type { HttpContext } from '@adonisjs/core/http'
import {
  createFinanceAdjustment,
  querySellerAdjustments,
} from '#utils/seller_adjustments'
import {
  adjustmentsQueryValidator,
  storeAdjustmentValidator,
} from '#validators/adjustments'

export default class SellerAdjustmentsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['q', 'type'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    const filters = await adjustmentsQueryValidator.validate(qs)
    return response.ok(await querySellerAdjustments(filters))
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeAdjustmentValidator)
    const result = await createFinanceAdjustment({
      type: payload.type,
      amount: payload.amount,
      reason: payload.reason,
      orderId: payload.orderId ?? null,
      actorId: payload.actorId,
      actorName: payload.actorName,
    })
    if (!result.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: result.error }],
      })
    }
    return response.created(result.adjustment)
  }
}
