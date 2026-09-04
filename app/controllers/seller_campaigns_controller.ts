import StoreCampaign, { type StoreCampaignManualStatus } from '#models/store_campaign'
import {
  emptyStoreDiscountTargeting,
  type StoreDiscountTargeting,
} from '#models/store_discount'
import {
  bulkCampaignDeleteValidator,
  bulkCampaignStatusValidator,
  campaignStatusValidator,
  campaignsQueryValidator,
  storeCampaignValidator,
  updateCampaignValidator,
} from '#validators/campaign'
import { querySellerCampaigns } from '#utils/seller_campaigns_query'
import type { SeoMeta } from '#models/blog_post'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function emptySeo(): SeoMeta {
  return {
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    robots: 'index,follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  }
}

function parseDate(value: string) {
  const dt = DateTime.fromISO(value, { setZone: true })
  if (!dt.isValid) return null
  return dt.toUTC()
}

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'campaign'
  )
}

function normalizeSeo(seo: Partial<SeoMeta> | null | undefined): SeoMeta {
  return { ...emptySeo(), ...(seo || {}) }
}

function normalizeTargeting(raw: any): StoreDiscountTargeting {
  return {
    ...emptyStoreDiscountTargeting(),
    ...(raw && typeof raw === 'object' ? raw : {}),
    productIds: Array.isArray(raw?.productIds) ? raw.productIds.map(String) : [],
    categoryIds: Array.isArray(raw?.categoryIds) ? raw.categoryIds.map(String) : [],
    brandIds: Array.isArray(raw?.brandIds) ? raw.brandIds.map(String) : [],
    excludeProductIds: Array.isArray(raw?.excludeProductIds)
      ? raw.excludeProductIds.map(String)
      : [],
    excludeCategoryIds: Array.isArray(raw?.excludeCategoryIds)
      ? raw.excludeCategoryIds.map(String)
      : [],
    excludeBrandIds: Array.isArray(raw?.excludeBrandIds) ? raw.excludeBrandIds.map(String) : [],
  }
}

function stringList(value: string[] | undefined) {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : []
}

export default class SellerCampaignsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await campaignsQueryValidator.validate(qs)
    return response.ok(await querySellerCampaigns(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await StoreCampaign.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'کمپین یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeCampaignValidator)
    const id =
      payload.id?.trim() ||
      `camp-${slugify(payload.name)}-${Date.now().toString(36).slice(-4)}`
    const slug = (payload.slug?.trim().toLowerCase() || id).replace(/[^a-z0-9-]/g, '-')

    const existing = await StoreCampaign.find(id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه کمپین تکراری است' }],
      })
    }
    const bySlug = await StoreCampaign.query().where('slug', slug).first()
    if (bySlug) {
      return response.conflict({
        errors: [{ field: 'slug', message: 'اسلاگ کمپین تکراری است' }],
      })
    }

    const startsAt = parseDate(payload.startsAt)
    const endsAt = parseDate(payload.endsAt)
    if (!startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (!endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    if (endsAt <= startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'پایان باید بعد از شروع باشد' }],
      })
    }

    const row = await StoreCampaign.create({
      id,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      manualStatus: (payload.manualStatus ?? 'draft') as StoreCampaignManualStatus,
      startsAt,
      endsAt,
      priority: Math.max(0, Math.round(payload.priority ?? 100)),
      image: payload.image?.trim() || null,
      landingUrl: payload.landingUrl?.trim() || '',
      slug,
      seo: normalizeSeo(payload.seo),
      targeting: normalizeTargeting(payload.targeting),
      discountIds: stringList(payload.discountIds),
      couponCodes: stringList(payload.couponCodes).map((c) => c.toUpperCase()),
      dealIds: stringList(payload.dealIds),
      bannerIds: stringList(payload.bannerIds),
    })

    return response.created(row.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const row = await StoreCampaign.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'کمپین یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateCampaignValidator)
    const slug = (
      payload.slug?.trim().toLowerCase() ||
      row.slug ||
      row.id
    ).replace(/[^a-z0-9-]/g, '-')

    if (slug !== row.slug) {
      const bySlug = await StoreCampaign.query().where('slug', slug).whereNot('id', row.id).first()
      if (bySlug) {
        return response.conflict({
          errors: [{ field: 'slug', message: 'اسلاگ کمپین تکراری است' }],
        })
      }
    }

    const startsAt = parseDate(payload.startsAt)
    const endsAt = parseDate(payload.endsAt)
    if (!startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'startsAt', message: 'زمان شروع نامعتبر است' }],
      })
    }
    if (!endsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'زمان پایان نامعتبر است' }],
      })
    }
    if (endsAt <= startsAt) {
      return response.unprocessableEntity({
        errors: [{ field: 'endsAt', message: 'پایان باید بعد از شروع باشد' }],
      })
    }

    row.merge({
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      manualStatus: (payload.manualStatus ?? row.manualStatus) as StoreCampaignManualStatus,
      startsAt,
      endsAt,
      priority: Math.max(0, Math.round(payload.priority ?? row.priority)),
      image: payload.image !== undefined ? payload.image?.trim() || null : row.image,
      landingUrl: payload.landingUrl?.trim() ?? row.landingUrl,
      slug,
      seo: normalizeSeo(payload.seo ?? row.seo),
      targeting: normalizeTargeting(payload.targeting ?? row.targeting),
      discountIds: payload.discountIds !== undefined ? stringList(payload.discountIds) : row.discountIds,
      couponCodes:
        payload.couponCodes !== undefined
          ? stringList(payload.couponCodes).map((c) => c.toUpperCase())
          : row.couponCodes,
      dealIds: payload.dealIds !== undefined ? stringList(payload.dealIds) : row.dealIds,
      bannerIds: payload.bannerIds !== undefined ? stringList(payload.bannerIds) : row.bannerIds,
    })
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async setStatus({ params, request, response }: HttpContext) {
    const row = await StoreCampaign.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'کمپین یافت نشد' }] })
    }
    const payload = await request.validateUsing(campaignStatusValidator)
    row.manualStatus = payload.manualStatus
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async bulkStatus({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkCampaignStatusValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    const updated = await StoreCampaign.query()
      .whereIn('id', ids)
      .update({ manual_status: payload.manualStatus })
    return response.ok({
      updated: Number(updated) || ids.length,
      manualStatus: payload.manualStatus,
    })
  }

  async bulkDestroy({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkCampaignDeleteValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    const deleted = await StoreCampaign.query().whereIn('id', ids).delete()
    return response.ok({ deleted: Number(deleted) || ids.length })
  }

  async destroy({ params, response }: HttpContext) {
    const row = await StoreCampaign.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'کمپین یافت نشد' }] })
    }
    await row.delete()
    return response.ok({ ok: true })
  }
}
