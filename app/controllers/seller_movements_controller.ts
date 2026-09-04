import StockMovement, { type StockMovementType } from '#models/stock_movement'
import {
  movementsQueryValidator,
  storeMovementValidator,
} from '#validators/inventory'
import { querySellerMovements } from '#utils/seller_movements_query'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerMovementsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.type === 'all' || qs.type === '') delete qs.type
    if (qs.warehouse && !qs.warehouseId) {
      qs.warehouseId = qs.warehouse
      delete qs.warehouse
    }
    if (qs.warehouseId === 'all' || qs.warehouseId === '') delete qs.warehouseId
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await movementsQueryValidator.validate(qs)
    return response.ok(await querySellerMovements(filters))
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeMovementValidator)
    const id = `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const movement = await StockMovement.create({
      id,
      productId: payload.productId.trim(),
      productTitle: (payload.productTitle ?? payload.productId).toString().trim(),
      variantId: payload.variantId ?? null,
      variantLabel: payload.variantLabel ?? null,
      warehouseId: payload.warehouseId.trim(),
      type: payload.type as StockMovementType,
      quantity: Math.round(payload.quantity),
      before: Math.max(0, Math.round(payload.before)),
      after: Math.max(0, Math.round(payload.after)),
      reason: (payload.reason ?? '').toString().trim(),
      actorName: (payload.actorName ?? 'سیستم').toString().trim() || 'سیستم',
    })
    return response.created(movement.toAdminJSON())
  }
}
