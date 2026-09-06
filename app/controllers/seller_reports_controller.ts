import type { HttpContext } from '@adonisjs/core/http'
import { querySellerFinanceReports } from '#utils/seller_reports'
import { reportsQueryValidator } from '#validators/reports'

export default class SellerReportsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.period === '' || qs.period === 'all') delete qs.period
    if (qs.start === '') delete qs.start
    if (qs.end === '') delete qs.end
    const filters = await reportsQueryValidator.validate(qs)
    return response.ok(await querySellerFinanceReports(filters))
  }
}

