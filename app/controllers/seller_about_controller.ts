import { loadAboutPage, saveAboutPage } from '#utils/about_page'
import { aboutValidator } from '#validators/about'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerAboutController {
  async show({ response }: HttpContext) {
    const about = await loadAboutPage()
    if (!about) {
      return response.ok(null)
    }
    return response.ok(about)
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(aboutValidator)
    const saved = await saveAboutPage(payload as Record<string, unknown>)
    return response.ok(saved)
  }
}
