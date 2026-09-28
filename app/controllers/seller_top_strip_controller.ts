import { recordAdminAudit } from '#utils/admin_audit'
import { normalizeTopStripSettings, saveTopStripSettings, loadTopStripSettings } from '#utils/top_strip'
import { topStripValidator } from '#validators/top_strip'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerTopStripController {
  async show({ response }: HttpContext) {
    return response.ok(await loadTopStripSettings())
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(topStripValidator)
    const saved = await saveTopStripSettings(normalizeTopStripSettings(payload))
    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'settings',
      entityId: 'top-strip',
      summary: saved.enabled ? 'نوار بالای سایت فعال و ذخیره شد' : 'نوار بالای سایت غیرفعال شد',
    })
    return response.ok(saved)
  }
}
