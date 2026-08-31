import SellerShop from '#models/seller_shop'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Requires authenticated user with seller|admin role AND an owned shop row.
 */
export default class SellerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({
        errors: [{ field: 'auth', message: 'احراز هویت لازم است' }],
      })
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return ctx.response.forbidden({
        errors: [{ field: 'role', message: 'دسترسی پنل فروشنده مجاز نیست' }],
      })
    }

    const shop = await SellerShop.query().where('user_id', user.id).first()
    if (!shop) {
      return ctx.response.forbidden({
        errors: [{ field: 'shop', message: 'فروشگاهی برای این کاربر ثبت نشده است' }],
      })
    }

    ctx.sellerShop = shop
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    sellerShop?: import('#models/seller_shop').default
  }
}
