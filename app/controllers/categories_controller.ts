import Category from '#models/category'
import Product from '#models/product'
import {
  storeCategoryValidator,
  updateCategoryValidator,
} from '#validators/category'
import { categoriesQueryValidator } from '#validators/categories'
import { querySellerCategories } from '#utils/seller_categories_query'
import type { HttpContext } from '@adonisjs/core/http'
import type { SeoMeta } from '#models/blog_post'

function normalizeSubs(
  subs?: Array<{ name: string; items?: string[]; image?: string | null }> | null
) {
  if (!subs?.length) return []
  return subs
    .map((sub) => ({
      name: sub.name.trim(),
      items: (sub.items ?? []).map((item) => item.trim()).filter(Boolean),
      ...(sub.image?.trim() ? { image: sub.image.trim() } : {}),
    }))
    .filter((sub) => sub.name.length > 0)
}

function asText(value: string | null | undefined) {
  return (value ?? '').toString().trim()
}

function normalizePageMeta(
  meta:
    | {
        hero: {
          image: string | null
          eyebrow: string | null
          title: string | null
          subtitle: string | null
        }
        seo: { heading: string | null; paragraphs: Array<string | null> }
      }
    | null
    | undefined
) {
  if (!meta) return null
  const hero = {
    image: asText(meta.hero.image),
    eyebrow: asText(meta.hero.eyebrow),
    title: asText(meta.hero.title),
    subtitle: asText(meta.hero.subtitle),
  }
  const paragraphs = (meta.seo.paragraphs ?? []).map((p) => asText(p)).filter(Boolean)
  const heading = asText(meta.seo.heading)
  if (
    !hero.image &&
    !hero.eyebrow &&
    !hero.title &&
    !hero.subtitle &&
    !heading &&
    !paragraphs.length
  ) {
    return null
  }
  return {
    hero,
    seo: {
      heading,
      paragraphs: paragraphs.length ? paragraphs : [''],
    },
  }
}

function normalizeSuggested(
  items?: Array<{
    id: string
    title: string
    image: string | null
    query: string
  }> | null
) {
  if (!items?.length) return null
  const next = items
    .map((item) => ({
      id: item.id.trim(),
      title: item.title.trim(),
      image: asText(item.image),
      query: item.query.trim(),
    }))
    .filter((item) => item.id && item.title && item.query)
  return next.length ? next : null
}

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

function normalizeSeo(seo?: Partial<SeoMeta> | null) {
  if (!seo) return null
  const next: SeoMeta = {
    ...emptySeo(),
    metaTitle: asText(seo.metaTitle),
    metaDescription: asText(seo.metaDescription),
    metaKeywords: asText(seo.metaKeywords),
    canonicalUrl: asText(seo.canonicalUrl),
    robots: asText(seo.robots) || 'index,follow',
    ogTitle: asText(seo.ogTitle),
    ogDescription: asText(seo.ogDescription),
    ogImage: asText(seo.ogImage),
    twitterTitle: asText(seo.twitterTitle),
    twitterDescription: asText(seo.twitterDescription),
    twitterImage: asText(seo.twitterImage),
  }
  const hasAny = Object.entries(next).some(([key, value]) => {
    if (key === 'robots') return value !== 'index,follow'
    return Boolean(value)
  })
  return hasAny ? next : null
}

async function resolveParentId(
  parentId: string | null | undefined,
  selfId?: string
): Promise<{ ok: true; parentId: string | null } | { ok: false; message: string }> {
  const raw = (parentId ?? '').toString().trim()
  if (!raw) return { ok: true, parentId: null }

  if (selfId && raw === selfId) {
    return { ok: false, message: 'دسته نمی‌تواند والد خودش باشد' }
  }

  const parent = await Category.find(raw)
  if (!parent) {
    return { ok: false, message: 'دسته والد یافت نشد' }
  }

  if (selfId) {
    let current: string | null = raw
    const seen = new Set<string>()
    while (current) {
      if (current === selfId) {
        return { ok: false, message: 'انتخاب این والد چرخه ایجاد می‌کند' }
      }
      if (seen.has(current)) break
      seen.add(current)
      const row = await Category.find(current)
      current = row?.parentId ?? null
    }
  }

  return { ok: true, parentId: raw }
}

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.query()
      .where('status', 'active')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
    return response.ok(categories.map((c) => c.toJSON()))
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category || category.status === 'inactive') {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok(category.toJSON())
  }

  async pageMeta({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category || category.status === 'inactive') {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok({
      meta: category.pageMeta,
      suggested: category.suggested ?? [],
    })
  }

  /** Admin: full payload including pageMeta / suggested / timestamps + filters */
  async adminIndex({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.parentId === 'all' || qs.parentId === '') delete qs.parentId
    if (qs.q === '') delete qs.q

    const filters = await categoriesQueryValidator.validate(qs)
    const result = await querySellerCategories(filters)
    return response.ok(result)
  }

  async adminShow({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok(category.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeCategoryValidator)
    const existing = await Category.find(payload.id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه دسته‌بندی تکراری است' }],
      })
    }

    const parent = await resolveParentId(payload.parentId)
    if (!parent.ok) {
      return response.badRequest({
        errors: [{ field: 'parentId', message: parent.message }],
      })
    }

    const category = await Category.create({
      id: payload.id,
      name: payload.name,
      icon: payload.icon,
      image: (payload.image ?? '').toString().trim() || null,
      text: (payload.text ?? '').toString().trim() || null,
      parentId: parent.parentId,
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      seo: normalizeSeo(payload.seo),
      subs: normalizeSubs(payload.subs),
      pageMeta: normalizePageMeta(payload.pageMeta),
      suggested: normalizeSuggested(payload.suggested),
    })

    return response.created(category.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateCategoryValidator)
    const parent = await resolveParentId(payload.parentId, category.id)
    if (!parent.ok) {
      return response.badRequest({
        errors: [{ field: 'parentId', message: parent.message }],
      })
    }

    category.name = payload.name
    category.icon = payload.icon
    category.image = (payload.image ?? '').toString().trim() || null
    category.text = (payload.text ?? '').toString().trim() || null
    category.parentId = parent.parentId
    category.status = payload.status === 'inactive' ? 'inactive' : 'active'
    category.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    category.seo = normalizeSeo(payload.seo)
    category.subs = normalizeSubs(payload.subs)
    category.pageMeta = normalizePageMeta(payload.pageMeta)
    category.suggested = normalizeSuggested(payload.suggested)
    await category.save()

    return response.ok(category.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }

    const childRow = await Category.query()
      .where('parent_id', category.id)
      .count('* as total')
      .first()
    const childTotal = Number((childRow as any)?.$extras?.total ?? (childRow as any)?.total ?? 0)
    if (childTotal > 0) {
      return response.conflict({
        errors: [
          {
            field: 'id',
            message: `این دسته ${childTotal} زیردسته دارد و قابل حذف نیست`,
          },
        ],
      })
    }

    const totalRow = await Product.query().where('category', category.id).count('* as total').first()
    const total = Number((totalRow as any)?.$extras?.total ?? (totalRow as any)?.total ?? 0)
    if (total > 0) {
      return response.conflict({
        errors: [
          {
            field: 'id',
            message: `این دسته ${total} محصول دارد و قابل حذف نیست`,
          },
        ],
      })
    }

    await category.delete()
    return response.ok({ message: 'دسته‌بندی حذف شد' })
  }
}
