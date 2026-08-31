import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Requires authenticated user with role === 'admin'.
 * Must run after auth middleware.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()
    if (user.role !== 'admin') {
      return ctx.response.forbidden({
        errors: [{ message: 'دسترسی فقط برای مدیر سایت مجاز است' }],
      })
    }
    return next()
  }
}
