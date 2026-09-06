import {
  loadNavigationSettings,
  normalizeNavigationSettings,
  saveNavigationSettings,
} from '#utils/navigation_settings'
import { navigationSettingsValidator } from '#validators/navigation_settings'
import { recordAdminAudit } from '#utils/admin_audit'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerNavigationController {
  async show({ response }: HttpContext) {
    return response.ok(await loadNavigationSettings())
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(navigationSettingsValidator)
    const saved = await saveNavigationSettings(normalizeNavigationSettings(payload))
    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'settings',
      entityId: 'navigation',
      summary: 'منوی سایت به‌روزرسانی شد',
    })
    return response.ok(saved)
  }
}
