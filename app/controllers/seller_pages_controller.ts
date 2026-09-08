import StaticPage, { type PageStatus } from '#models/static_page'
import type { SeoMeta } from '#models/blog_post'
import {
  pageStatusValidator,
  storePageValidator,
  updatePageValidator,
} from '#validators/page'
import { pagesQueryValidator } from '#validators/pages_query'
import { querySellerPages } from '#utils/seller_pages_query'
import { parseListQs } from '#utils/seller_schedule_filters'
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

function normalizePath(path: string) {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value || !String(value).trim()) return null
  const dt = DateTime.fromISO(String(value), { setZone: true })
  return dt.isValid ? dt.toUTC() : null
}

export default class SellerPagesController {
  async index({ request, response }: HttpContext) {
    const filters = await pagesQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerPages(filters))
  }

  async show({ params, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page) {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }
    return response.ok(page.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storePageValidator)
    const titleSlug = payload.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'page'
    let id = payload.id?.trim() || `page-${titleSlug}-${Date.now().toString(36).slice(-4)}`
    if (await StaticPage.find(id)) {
      id = `page-${titleSlug}-${Date.now().toString(36)}`
    }

    const path = normalizePath(
      payload.path?.trim()
        ? payload.path
        : `/${titleSlug}`,
    )
    const pathClash = await StaticPage.query().where('path', path).first()
    if (pathClash) {
      return response.conflict({
        errors: [{ field: 'path', message: 'مسیر تکراری است' }],
      })
    }

    const status = (payload.status ?? 'draft') as PageStatus
    const publishedAt =
      status === 'published'
        ? parseOptionalDate(payload.publishedAt) || DateTime.utc()
        : null

    const page = await StaticPage.create({
      id,
      path,
      title: payload.title,
      subtitle: payload.subtitle?.trim() || '',
      icon: payload.icon?.trim() || 'i-tabler-file-text',
      sections: payload.sections ?? [],
      sourceId: payload.sourceId ?? null,
      status,
      seo: { ...emptySeo(), ...(payload.seo || {}) },
      publishedAt,
      template: payload.template?.trim() || 'default',
    })

    return response.created(page.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page) {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }

    const payload = await request.validateUsing(updatePageValidator)
    const path = normalizePath(payload.path)
    const pathClash = await StaticPage.query()
      .where('path', path)
      .whereNot('id', page.id)
      .first()
    if (pathClash) {
      return response.conflict({
        errors: [{ field: 'path', message: 'مسیر تکراری است' }],
      })
    }

    const status = (payload.status ?? page.status) as PageStatus
    const publishedAt =
      status === 'published'
        ? parseOptionalDate(payload.publishedAt) || page.publishedAt || DateTime.utc()
        : page.publishedAt

    page.merge({
      path,
      title: payload.title,
      subtitle: payload.subtitle?.trim() ?? page.subtitle,
      icon: payload.icon?.trim() || page.icon || 'i-tabler-file-text',
      sections: payload.sections ?? page.sections,
      sourceId: payload.sourceId !== undefined ? payload.sourceId : page.sourceId,
      status,
      seo: { ...emptySeo(), ...(payload.seo || page.seo || {}) },
      publishedAt,
      template: payload.template?.trim() || page.template || 'default',
    })
    await page.save()
    return response.ok(page.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page) {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }
    await page.delete()
    return response.ok({ message: 'صفحه حذف شد' })
  }

  async setStatus({ params, request, response }: HttpContext) {
    const page = await StaticPage.find(params.id)
    if (!page) {
      return response.notFound({ errors: [{ field: 'id', message: 'صفحه یافت نشد' }] })
    }
    const { status } = await request.validateUsing(pageStatusValidator)
    page.status = status
    if (status === 'published' && !page.publishedAt) {
      page.publishedAt = DateTime.utc()
    }
    await page.save()
    return response.ok(page.toAdminJSON())
  }
}
