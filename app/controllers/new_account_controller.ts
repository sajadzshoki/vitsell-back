import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold leftover — vitsell signup is OTP-based via AuthController. */
export default class NewAccountController {
  async store({ response }: HttpContext) {
    return response.notFound({ message: 'Not used' })
  }
}
