import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Requires an active courier. Must run after auth middleware.
 * Couriers are not seller admins and fail AdminMiddleware.
 */
export default class CourierMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()
    if (user.role !== 'courier' || user.status !== 'active') {
      return ctx.response.forbidden({
        errors: [{ message: 'دسترسی فقط برای پیک فعال مجاز است' }],
      })
    }
    return next()
  }
}
