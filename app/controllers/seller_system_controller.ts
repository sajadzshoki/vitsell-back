import { querySystemOverview } from '#utils/seller_system_query'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerSystemController {
  async summary({ response }: HttpContext) {
    return response.ok(await querySystemOverview())
  }
}
