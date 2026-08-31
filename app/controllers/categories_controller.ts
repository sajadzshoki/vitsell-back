import Category from '#models/category'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const idRule = vine.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const subSchema = vine.object({
  name: vine.string().trim(),
  items: vine.array(vine.string().trim()).optional(),
  image: vine.string().trim().nullable().optional(),
})

/** Empty strings become null via bodyparser `convertEmptyStringsToNull`. */
const emptyableString = () => vine.string().trim().nullable()

const pageMetaSchema = vine
  .object({
    hero: vine.object({
      image: emptyableString(),
      eyebrow: emptyableString(),
      title: emptyableString(),
      subtitle: emptyableString(),
    }),
    seo: vine.object({
      heading: emptyableString(),
      paragraphs: vine.array(emptyableString()),
    }),
  })
  .nullable()
  .optional()

const suggestedSchema = vine
  .array(
    vine.object({
      id: vine.string().trim(),
      title: vine.string().trim(),
      image: emptyableString(),
      query: vine.string().trim(),
    })
  )
  .nullable()
  .optional()

const storeValidator = vine.compile(
  vine.object({
    id: idRule.clone(),
    name: vine.string().trim().minLength(1),
    icon: vine.string().trim().minLength(1),
    image: vine.string().trim().nullable().optional(),
    text: vine.string().trim().nullable().optional(),
    subs: vine.array(subSchema).optional(),
    pageMeta: pageMetaSchema,
    suggested: suggestedSchema,
  })
)

const updateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    icon: vine.string().trim().minLength(1),
    image: vine.string().trim().nullable().optional(),
    text: vine.string().trim().nullable().optional(),
    subs: vine.array(subSchema).optional(),
    pageMeta: pageMetaSchema,
    suggested: suggestedSchema,
  })
)

function normalizeSubs(
  subs?: Array<{ name: string; items?: string[]; image?: string }> | null
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

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.query().orderBy('id', 'asc')
    return response.ok(categories.map((c) => c.toJSON()))
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok(category.toJSON())
  }

  async pageMeta({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok({
      meta: category.pageMeta,
      suggested: category.suggested ?? [],
    })
  }

  /** Admin: full payload including pageMeta / suggested / timestamps */
  async adminIndex({ response }: HttpContext) {
    const categories = await Category.query().orderBy('id', 'asc')
    return response.ok(categories.map((c) => c.toAdminJSON()))
  }

  async adminShow({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok(category.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeValidator)
    const existing = await Category.find(payload.id)
    if (existing) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه دسته‌بندی تکراری است' }],
      })
    }

    const category = await Category.create({
      id: payload.id,
      name: payload.name,
      icon: payload.icon,
      image: (payload.image ?? '').toString().trim() || null,
      text: (payload.text ?? '').toString().trim() || null,
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

    const payload = await request.validateUsing(updateValidator)
    category.name = payload.name
    category.icon = payload.icon
    category.image = (payload.image ?? '').toString().trim() || null
    category.text = (payload.text ?? '').toString().trim() || null
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
