import Category from '#models/category'
import CategorySpecKey from '#models/category_spec_key'
import Product from '#models/product'
import {
  storeCategoryValidator,
  updateCategoryValidator,
} from '#validators/category'
import { categoriesQueryValidator } from '#validators/categories'
import { querySellerCategories } from '#utils/seller_categories_query'
import type { HttpContext } from '@adonisjs/core/http'
import type { SeoMeta } from '#models/blog_post'
import db from '@adonisjs/lucid/services/db'

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

  /** Suggested free-form spec keys previously used in this category */
  async specKeys({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }

    const rows = await CategorySpecKey.query()
      .where('category_id', category.id)
      .orderBy('usage_count', 'desc')
      .orderBy('key', 'asc')

    const usageByKey = new Map<string, number>()
    for (const row of rows) {
      const key = String(row.key || '').trim()
      if (!key) continue
      usageByKey.set(key, Number(row.usageCount) || 0)
    }

    // Also harvest keys from existing products (covers seed / pre-upsert data)
    const products = await Product.query()
      .where('category', category.id)
      .select('id', 'specs')

    for (const product of products) {
      const specs = Array.isArray(product.specs) ? product.specs : []
      for (const spec of specs) {
        const key = String(spec?.key || '').trim()
        if (!key) continue
        usageByKey.set(key, (usageByKey.get(key) || 0) + 1)
      }
    }

    const items = [...usageByKey.entries()]
      .map(([key, usageCount]) => ({
        id: `derived-${category.id}-${key}`,
        categoryId: category.id,
        key,
        usageCount,
      }))
      .sort((a, b) => b.usageCount - a.usageCount || a.key.localeCompare(b.key, 'fa'))

    return response.ok({ items })
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

    // Products still listed in seller panel block delete
    const listed = await db
      .from('products')
      .innerJoin('seller_listings', 'seller_listings.product_id', 'products.id')
      .where('products.category', category.id)
      .count('* as total')
      .first()
    const listedTotal = Number((listed as any)?.total ?? 0)
    if (listedTotal > 0) {
      return response.conflict({
        errors: [
          {
            field: 'id',
            message: `این دسته ${listedTotal} محصول دارد و قابل حذف نیست`,
          },
        ],
      })
    }

    // Seed / leftover product rows without a listing still hold the FK.
    // Remove safe orphans; block if any are referenced by orders.
    const orphanRows = await db
      .from('products')
      .leftJoin('seller_listings', 'seller_listings.product_id', 'products.id')
      .where('products.category', category.id)
      .whereNull('seller_listings.id')
      .select('products.id')

    const orphanIds = (orphanRows as Array<{ id: string }>).map((row) => row.id).filter(Boolean)

    if (orphanIds.length) {
      const [orderRef, sellerOrderRef] = await Promise.all([
        db.from('order_items').whereIn('product_id', orphanIds).count('* as total').first(),
        db.from('seller_order_items').whereIn('product_id', orphanIds).count('* as total').first(),
      ])
      const orderTotal
        = Number((orderRef as any)?.total ?? 0) + Number((sellerOrderRef as any)?.total ?? 0)
      if (orderTotal > 0) {
        return response.conflict({
          errors: [
            {
              field: 'id',
              message:
                'محصولات این دسته در سفارش‌ها استفاده شده‌اند و قابل حذف نیست',
            },
          ],
        })
      }

      await Product.query().whereIn('id', orphanIds).delete()
    }

    try {
      await category.delete()
    } catch {
      return response.conflict({
        errors: [
          {
            field: 'id',
            message: 'حذف دسته‌بندی ممکن نیست؛ هنوز ارجاعی به این دسته وجود دارد',
          },
        ],
      })
    }

    return response.ok({ message: 'دسته‌بندی حذف شد' })
  }
}
