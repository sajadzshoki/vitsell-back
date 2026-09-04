import ContentPromo from '#models/content_promo'
import { contentPromosQueryValidator } from '#validators/promotions_query'
import { querySellerContentPromos } from '#utils/seller_promotions_query'
import { parseListQs } from '#utils/seller_schedule_filters'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const storeValidator = vine.compile(
  vine.object({
    id: idRule.clone(),
    eyebrow: vine.string().trim().optional(),
    title: vine.string().trim().minLength(1),
    subtitle: vine.string().trim().minLength(1),
    tone: vine.enum(['primary', 'warning'] as const).optional(),
    icon: vine.string().trim().optional(),
    primaryCtaLabel: vine.string().trim().minLength(1),
    primaryCtaTo: vine.string().trim().optional(),
    secondaryCtaLabel: vine.string().trim().optional(),
    secondaryCtaTo: vine.string().trim().optional(),
    active: vine.boolean().optional(),
  })
)

const updateValidator = vine.compile(
  vine.object({
    eyebrow: vine.string().trim().optional(),
    title: vine.string().trim().minLength(1),
    subtitle: vine.string().trim().minLength(1),
    tone: vine.enum(['primary', 'warning'] as const).optional(),
    icon: vine.string().trim().optional(),
    primaryCtaLabel: vine.string().trim().minLength(1),
    primaryCtaTo: vine.string().trim().optional(),
    secondaryCtaLabel: vine.string().trim().optional(),
    secondaryCtaTo: vine.string().trim().optional(),
    active: vine.boolean().optional(),
  })
)

const activeValidator = vine.compile(
  vine.object({
    active: vine.boolean(),
  })
)

function applyFields(
  promo: ContentPromo,
  payload: {
    eyebrow?: string
    title: string
    subtitle: string
    tone?: 'primary' | 'warning'
    icon?: string
    primaryCtaLabel: string
    primaryCtaTo?: string
    secondaryCtaLabel?: string
    secondaryCtaTo?: string
    active?: boolean
  }
) {
  promo.eyebrow = payload.eyebrow?.trim() ?? promo.eyebrow ?? ''
  promo.title = payload.title.trim()
  promo.subtitle = payload.subtitle.trim()
  promo.tone = payload.tone ?? (promo.tone === 'warning' ? 'warning' : 'primary')
  promo.icon = (payload.icon?.trim() || promo.icon || 'sparkles')
  promo.primaryCtaLabel = payload.primaryCtaLabel.trim()
  promo.primaryCtaTo = payload.primaryCtaTo?.trim() || null
  promo.secondaryCtaLabel = payload.secondaryCtaLabel?.trim() || null
  promo.secondaryCtaTo = payload.secondaryCtaTo?.trim() || null
  if (payload.active !== undefined) promo.active = payload.active
}

export default class ContentPromosController {
  async index({ request, response }: HttpContext) {
    const filters = await contentPromosQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerContentPromos(filters))
  }

  async show({ params, response }: HttpContext) {
    const promo = await ContentPromo.find(params.id)
    if (!promo) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرومو یافت نشد' }] })
    }
    return response.ok(promo.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const existing = await ContentPromo.find(payload.id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه پرومو تکراری است' }],
      })
    }

    const promo = new ContentPromo()
    promo.id = payload.id
    promo.active = payload.active ?? true
    applyFields(promo, payload)
    await promo.save()

    return response.created(promo.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const promo = await ContentPromo.find(params.id)
    if (!promo) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرومو یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateValidator)
    applyFields(promo, payload)
    await promo.save()

    return response.ok(promo.toAdminJSON())
  }

  async setActive({ params, request, response }: HttpContext) {
    const promo = await ContentPromo.find(params.id)
    if (!promo) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرومو یافت نشد' }] })
    }

    const { active } = await request.validateUsing(activeValidator)
    promo.active = active
    await promo.save()
    return response.ok(promo.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const promo = await ContentPromo.find(params.id)
    if (!promo) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرومو یافت نشد' }] })
    }
    await promo.delete()
    return response.ok({ message: 'پرومو حذف شد' })
  }
}
