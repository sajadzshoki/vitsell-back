import Banner, { type BannerLinkType, type BannerPlacement, type BannerType } from '#models/banner'
import ContentBlock from '#models/content_block'
import {
  bannerActiveValidator,
  storeBannerValidator,
  updateBannerValidator,
} from '#validators/banner'
import { bannersQueryValidator } from '#validators/banners_query'
import { querySellerBanners } from '#utils/seller_banners_query'
import { parseListQs } from '#utils/seller_schedule_filters'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function parseOptionalDate(value: string | null | undefined) {
  if (!value || !String(value).trim()) return null
  const dt = DateTime.fromISO(String(value), { setZone: true })
  return dt.isValid ? dt.toUTC() : null
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

async function syncHeroSlidesFromBanners() {
  const heroes = await Banner.query()
    .where('placement', 'homepage_hero')
    .where('active', true)
    .orderBy('priority', 'asc')
    .orderBy('sort_order', 'asc')

  const now = DateTime.utc()
  const slides = heroes.filter((b) => b.isLive(now)).map((b) => b.toHeroSlideJSON())
  await ContentBlock.updateOrCreate(
    { key: 'heroSlides' },
    { key: 'heroSlides', value: slides }
  )
}

export default class SellerBannersController {
  async index({ request, response }: HttpContext) {
    const filters = await bannersQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerBanners(filters))
  }

  async show({ params, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.notFound({ errors: [{ field: 'id', message: 'بنر یافت نشد' }] })
    }
    return response.ok(banner.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeBannerValidator)
    const id =
      payload.id?.trim() ||
      `banner-${slugify(payload.internalName || payload.title || 'item')}-${Date.now().toString(36).slice(-4)}`

    const existing = await Banner.find(id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه بنر تکراری است' }],
      })
    }

    const type = (payload.type ?? 'main') as BannerType
    const placement = (payload.placement ??
      (type === 'main' ? 'homepage_hero' : 'homepage_promo_strip')) as BannerPlacement

    const banner = await Banner.create({
      id,
      title: payload.title?.trim() || '',
      internalName: payload.internalName.trim(),
      alt: payload.alt?.trim() || payload.title?.trim() || '',
      image: payload.image,
      imageMobile: payload.imageMobile?.trim() || null,
      link: payload.link?.trim() || '',
      linkType: (payload.linkType ?? 'url') as BannerLinkType,
      productId: payload.productId ?? null,
      brandId: payload.brandId ?? null,
      campaignId: payload.campaignId ?? null,
      type,
      placement,
      categoryId: payload.categoryId ?? null,
      active: payload.active ?? true,
      startsAt: parseOptionalDate(payload.startsAt),
      endsAt: parseOptionalDate(payload.endsAt),
      sortOrder: Math.round(payload.sortOrder ?? 0),
      priority: Math.round(payload.priority ?? 100),
    })

    if (banner.placement === 'homepage_hero') {
      await syncHeroSlidesFromBanners()
    }

    return response.created(banner.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.notFound({ errors: [{ field: 'id', message: 'بنر یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateBannerValidator)
    const type = (payload.type ?? banner.type) as BannerType
    const placement = (payload.placement ?? banner.placement) as BannerPlacement

    banner.merge({
      title: payload.title?.trim() ?? banner.title,
      internalName: payload.internalName.trim(),
      alt: payload.alt?.trim() ?? banner.alt,
      image: payload.image,
      imageMobile:
        payload.imageMobile !== undefined
          ? payload.imageMobile?.trim() || null
          : banner.imageMobile,
      link: payload.link?.trim() ?? banner.link,
      linkType: (payload.linkType ?? banner.linkType) as BannerLinkType,
      productId: payload.productId !== undefined ? payload.productId : banner.productId,
      brandId: payload.brandId !== undefined ? payload.brandId : banner.brandId,
      campaignId: payload.campaignId !== undefined ? payload.campaignId : banner.campaignId,
      type,
      placement,
      categoryId: payload.categoryId !== undefined ? payload.categoryId : banner.categoryId,
      active: payload.active ?? banner.active,
      startsAt:
        payload.startsAt !== undefined ? parseOptionalDate(payload.startsAt) : banner.startsAt,
      endsAt: payload.endsAt !== undefined ? parseOptionalDate(payload.endsAt) : banner.endsAt,
      sortOrder: Math.round(payload.sortOrder ?? banner.sortOrder),
      priority: Math.round(payload.priority ?? banner.priority),
    })
    await banner.save()

    if (banner.placement === 'homepage_hero' || placement === 'homepage_hero') {
      await syncHeroSlidesFromBanners()
    }

    return response.ok(banner.toAdminJSON())
  }

  async setActive({ params, request, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.notFound({ errors: [{ field: 'id', message: 'بنر یافت نشد' }] })
    }
    const { active } = await request.validateUsing(bannerActiveValidator)
    banner.active = active
    await banner.save()
    if (banner.placement === 'homepage_hero') {
      await syncHeroSlidesFromBanners()
    }
    return response.ok(banner.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return response.notFound({ errors: [{ field: 'id', message: 'بنر یافت نشد' }] })
    }
    const wasHero = banner.placement === 'homepage_hero'
    await banner.delete()
    if (wasHero) {
      await syncHeroSlidesFromBanners()
    }
    return response.ok({ message: 'بنر حذف شد' })
  }
}
