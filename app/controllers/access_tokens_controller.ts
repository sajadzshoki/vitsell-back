import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold leftover — digishop auth uses OTP via AuthController. */
export default class AccessTokensController {
  async store({ response }: HttpContext) {
    return response.notFound({ message: 'Not used' })
  }

  async destroy({ response }: HttpContext) {
    return response.notFound({ message: 'Not used' })
  }
}
