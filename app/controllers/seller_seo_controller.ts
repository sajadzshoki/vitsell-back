import {
  loadSeoSettings,
  normalizeSeoSettings,
  saveSeoSettings,
} from '#utils/seo_settings'
import {
  createSeoRedirect,
  deleteSeoRedirect,
  loadSeoRedirects,
  updateSeoRedirect,
} from '#utils/seo_redirects'
import { seoSettingsValidator } from '#validators/seo_settings'
import { seoRedirectValidator } from '#validators/seo_redirects'
import { recordAdminAudit } from '#utils/admin_audit'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerSeoController {
  async show({ response }: HttpContext) {
    return response.ok(await loadSeoSettings())
  }

  async update({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(seoSettingsValidator)
    const current = await loadSeoSettings()
    const saved = await saveSeoSettings(normalizeSeoSettings({ ...current, ...payload }))
    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'settings',
      entityId: 'seo',
      summary: 'تنظیمات سئو به‌روزرسانی شد',
    })
    return response.ok(saved)
  }

  async redirectsIndex({ response }: HttpContext) {
    return response.ok({ items: await loadSeoRedirects() })
  }

  async redirectsStore({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(seoRedirectValidator)
    const result = await createSeoRedirect(payload)
    if (!result.ok || !result.item) {
      return response.unprocessableEntity({
        errors: [{ field: 'source', message: result.error || 'ثبت ریدایرکت ناموفق بود' }],
      })
    }
    await recordAdminAudit(actor, {
      action: 'create',
      entity: 'settings',
      entityId: result.item.id,
      summary: `ریدایرکت ${result.item.source} → ${result.item.destination}`,
    })
    return response.created(result.item)
  }

  async redirectsUpdate({ auth, params, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(seoRedirectValidator)
    const result = await updateSeoRedirect(String(params.id), payload)
    if (result.error === 'not_found') {
      return response.notFound({ errors: [{ field: 'id', message: 'ریدایرکت یافت نشد' }] })
    }
    if (!result.ok || !result.item) {
      return response.unprocessableEntity({
        errors: [{ field: 'source', message: result.error || 'به‌روزرسانی ریدایرکت ناموفق بود' }],
      })
    }
    await recordAdminAudit(actor, {
      action: 'update',
      entity: 'settings',
      entityId: result.item.id,
      summary: `ریدایرکت ${result.item.source} به‌روز شد`,
    })
    return response.ok(result.item)
  }

  async redirectsDestroy({ auth, params, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const result = await deleteSeoRedirect(String(params.id))
    if (result.error === 'not_found') {
      return response.notFound({ errors: [{ field: 'id', message: 'ریدایرکت یافت نشد' }] })
    }
    await recordAdminAudit(actor, {
      action: 'delete',
      entity: 'settings',
      entityId: String(params.id),
      summary: 'ریدایرکت حذف شد',
    })
    return response.ok({ ok: true })
  }
}
