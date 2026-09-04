import { marketingSummaryQueryValidator } from '#validators/marketing'
import { queryMarketingSummary } from '#utils/seller_marketing_query'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerMarketingController {
  async summary({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.from === '') delete qs.from
    if (qs.to === '') delete qs.to
    const filters = await marketingSummaryQueryValidator.validate(qs)
    return response.ok(await queryMarketingSummary(filters))
  }
}
