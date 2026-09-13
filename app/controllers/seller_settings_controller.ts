import {
  loadPlatformSettings,
  mergePlatformSettingsUpdate,
  savePlatformSettings,
} from '#utils/platform_settings'
import { platformSettingsValidator } from '#validators/platform_settings'
import { recordAdminAudit } from '#utils/admin_audit'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerSettingsController {
  async show({ response }: HttpContext) {
    return response.ok(await loadPlatformSettings())
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    // Copy before validateUsing — validators may mutate/strip nulls on the live body
    const raw = { ...(request.body() as Record<string, unknown>) }
    const payload = await request.validateUsing(platformSettingsValidator)
    const current = await loadPlatformSettings()
    const merged = mergePlatformSettingsUpdate(
      current,
      payload as unknown as Record<string, unknown>,
      raw,
    )
    const saved = await savePlatformSettings(merged)
    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'settings',
      entityId: 'platform',
      summary: 'تنظیمات پلتفرم به‌روزرسانی شد',
    })
    return response.ok(saved)
  }
}
