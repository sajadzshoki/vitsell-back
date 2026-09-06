import type { HttpContext } from '@adonisjs/core/http'
import { transactionsQueryValidator } from '#validators/transactions'
import {
  findSellerTransaction,
  querySellerTransactions,
} from '#utils/seller_transactions_query'

export default class SellerTransactionsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['type', 'status', 'gateway', 'q', 'orderId'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await transactionsQueryValidator.validate(qs)
    return response.ok(await querySellerTransactions(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await findSellerTransaction(String(params.id || '').trim())
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تراکنش یافت نشد' }] })
    }
    return response.ok(row)
  }
}
