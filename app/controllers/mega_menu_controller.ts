import { loadPublicMegaMenuTree, resolveMegaMenuPath } from '#utils/mega_menu_tree'
import type { HttpContext } from '@adonisjs/core/http'

export default class MegaMenuController {
  /** Public storefront mega menu tree — navigation only, not category taxonomy. */
  async index({ response }: HttpContext) {
    const tree = await loadPublicMegaMenuTree()
    return response.ok(tree)
  }

  /**
   * Resolve SEO path `/category/{menu}/{section}/…/{item}` to catalog filter.
   * Query: `?path=mobile/mobile-phone/price-up-to-30ml`
   */
  async resolve({ request, response }: HttpContext) {
    const path = String(request.input('path') || '').trim()
    if (!path) {
      return response.badRequest({ errors: [{ field: 'path', message: 'path الزامی است' }] })
    }
    const resolved = await resolveMegaMenuPath(path)
    if (!resolved) {
      return response.notFound({ errors: [{ field: 'path', message: 'مسیر منو یافت نشد' }] })
    }
    return response.ok(resolved)
  }
}
