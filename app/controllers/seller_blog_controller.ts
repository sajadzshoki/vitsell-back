import BlogPost, { type BlogStatus, type SeoMeta } from '#models/blog_post'
import {
  blogStatusValidator,
  storeBlogValidator,
  updateBlogValidator,
} from '#validators/blog'
import { blogQueryValidator } from '#validators/blog_query'
import { querySellerBlogPosts } from '#utils/seller_blog_query'
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
    .slice(0, 60)
}

function resolveStatus(payload: {
  status?: BlogStatus
  scheduledAt?: string | null
  active?: boolean
}): BlogStatus {
  if (payload.status) {
    if (payload.status === 'scheduled' && payload.scheduledAt) {
      const t = Date.parse(payload.scheduledAt)
      if (!Number.isNaN(t) && t <= Date.now()) return 'published'
    }
    return payload.status
  }
  if (payload.active === false) return 'draft'
  return 'published'
}

function deriveActive(status: BlogStatus, scheduledAt: DateTime | null) {
  if (status === 'published') return true
  if (status === 'scheduled' && scheduledAt && scheduledAt <= DateTime.utc()) return true
  return false
}

export default class SellerBlogController {
  async index({ request, response }: HttpContext) {
    const filters = await blogQueryValidator.validate(parseListQs({ ...request.qs() }))
    return response.ok(await querySellerBlogPosts(filters))
  }

  async show({ params, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) {
      return response.notFound({ errors: [{ field: 'id', message: 'مطلب یافت نشد' }] })
    }
    return response.ok(post.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeBlogValidator)
    const id =
      payload.id?.trim() ||
      `blog-${slugify(payload.title)}-${Date.now().toString(36).slice(-5)}`

    const existing = await BlogPost.find(id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه مطلب تکراری است' }],
      })
    }

    const status = resolveStatus(payload)
    const scheduledAt = parseOptionalDate(payload.scheduledAt)
    const publishedAt =
      status === 'published'
        ? parseOptionalDate(payload.publishedAt) || DateTime.utc()
        : null
    const featured = payload.featured ?? payload.popular ?? false

    const post = await BlogPost.create({
      id,
      title: payload.title,
      excerpt: payload.excerpt,
      date: payload.date?.trim() || publishedAt?.toISODate() || '',
      category: payload.category,
      readTime: payload.readTime?.trim() || '',
      author: payload.author,
      image: payload.image,
      relatedCategories: payload.relatedCategories ?? [],
      content: payload.content,
      highlights: payload.highlights?.length ? payload.highlights : null,
      popular: featured,
      engagement: Math.round(payload.engagement ?? 0),
      active: deriveActive(status, scheduledAt),
      status,
      publishedAt,
      scheduledAt: status === 'scheduled' ? scheduledAt : null,
      featured,
      imageAlt: payload.imageAlt?.trim() || payload.title,
      tags: payload.tags ?? [],
      relatedPostIds: payload.relatedPostIds ?? [],
      seo: { ...emptySeo(), ...(payload.seo || {}) },
    })

    return response.created(post.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) {
      return response.notFound({ errors: [{ field: 'id', message: 'مطلب یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateBlogValidator)
    const status = resolveStatus(payload)
    const scheduledAt = parseOptionalDate(payload.scheduledAt)
    const featured = payload.featured ?? payload.popular ?? post.featured
    const publishedAt =
      status === 'published'
        ? parseOptionalDate(payload.publishedAt) || post.publishedAt || DateTime.utc()
        : post.publishedAt

    post.merge({
      title: payload.title,
      excerpt: payload.excerpt,
      date: payload.date?.trim() || post.date,
      category: payload.category,
      readTime: payload.readTime?.trim() ?? post.readTime,
      author: payload.author,
      image: payload.image,
      relatedCategories: payload.relatedCategories ?? [],
      content: payload.content,
      highlights: payload.highlights?.length ? payload.highlights : null,
      popular: featured,
      engagement: Math.round(payload.engagement ?? post.engagement ?? 0),
      active: deriveActive(status, scheduledAt),
      status,
      publishedAt,
      scheduledAt: status === 'scheduled' ? scheduledAt : null,
      featured,
      imageAlt: payload.imageAlt?.trim() || payload.title,
      tags: payload.tags ?? [],
      relatedPostIds: payload.relatedPostIds ?? [],
      seo: { ...emptySeo(), ...(payload.seo || {}) },
    })
    await post.save()
    return response.ok(post.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) {
      return response.notFound({ errors: [{ field: 'id', message: 'مطلب یافت نشد' }] })
    }
    await post.delete()
    return response.ok({ message: 'مطلب حذف شد' })
  }

  async setStatus({ params, request, response }: HttpContext) {
    const post = await BlogPost.find(params.id)
    if (!post) {
      return response.notFound({ errors: [{ field: 'id', message: 'مطلب یافت نشد' }] })
    }
    const { status } = await request.validateUsing(blogStatusValidator)
    post.status = status
    post.active = status === 'published'
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = DateTime.utc()
    }
    await post.save()
    return response.ok(post.toAdminJSON())
  }
}
