import ProductAttribute, { type AttributeType, type AttributeValue } from '#models/product_attribute'
import {
  attributeStatusValidator,
  attributesQueryValidator,
  storeAttributeValidator,
  updateAttributeValidator,
} from '#validators/attribute'
import { querySellerAttributes } from '#utils/seller_attributes_query'
import type { HttpContext } from '@adonisjs/core/http'

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'attr'
  )
}

function normalizeValues(
  values: Array<{
    id?: string
    label: string
    value?: string
    meta?: string | null
    sortOrder?: number
    status?: 'active' | 'inactive'
    slug?: string
  }> | null | undefined,
  slugBase: string
): AttributeValue[] {
  if (!values?.length) return []
  return values
    .map((v, i) => {
      const label = v.label.trim()
      if (!label) return null
      const value =
        (v.value || label)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-') || `v-${i}`
      return {
        id: v.id?.trim() || `val-${slugBase}-${i}-${Date.now().toString(36).slice(-3)}`,
        label,
        value,
        meta: v.meta?.trim() || null,
        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : i,
        status: v.status === 'inactive' ? 'inactive' : 'active',
        ...(v.slug?.trim() ? { slug: v.slug.trim() } : {}),
      } as AttributeValue
    })
    .filter(Boolean) as AttributeValue[]
}

export default class SellerAttributesController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.type === 'all' || qs.type === '') delete qs.type
    if (qs.trait === 'all' || qs.trait === '') delete qs.trait
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await attributesQueryValidator.validate(qs)
    const result = await querySellerAttributes(filters)
    return response.ok(result)
  }

  async show({ params, response }: HttpContext) {
    const attribute = await ProductAttribute.find(params.id)
    if (!attribute) {
      return response.notFound({ errors: [{ field: 'id', message: 'ویژگی یافت نشد' }] })
    }
    return response.ok(attribute.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeAttributeValidator)
    const slug = payload.slug.trim().toLowerCase() || slugify(payload.name)
    const id = payload.id?.trim() || `attr-${slug}`

    const byId = await ProductAttribute.find(id)
    if (byId) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه ویژگی تکراری است' }],
      })
    }
    const bySlug = await ProductAttribute.query().where('slug', slug).first()
    if (bySlug) {
      return response.conflict({
        errors: [{ field: 'slug', message: 'اسلاگ ویژگی تکراری است' }],
      })
    }

    const attribute = await ProductAttribute.create({
      id,
      name: payload.name.trim(),
      slug,
      type: (payload.type ?? 'select') as AttributeType,
      values: normalizeValues(payload.values, slug),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      filterable: payload.filterable ?? true,
      searchable: payload.searchable ?? false,
      variantDefining: payload.variantDefining ?? true,
      categoryIds: payload.categoryIds ?? [],
    })

    return response.created(attribute.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const attribute = await ProductAttribute.find(params.id)
    if (!attribute) {
      return response.notFound({ errors: [{ field: 'id', message: 'ویژگی یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateAttributeValidator)
    attribute.name = payload.name.trim()
    if (payload.type) attribute.type = payload.type as AttributeType
    if (payload.values) attribute.values = normalizeValues(payload.values, attribute.slug)
    attribute.status = payload.status === 'inactive' ? 'inactive' : 'active'
    attribute.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    if (payload.filterable != null) attribute.filterable = payload.filterable
    if (payload.searchable != null) attribute.searchable = payload.searchable
    if (payload.variantDefining != null) attribute.variantDefining = payload.variantDefining
    if (payload.categoryIds) attribute.categoryIds = payload.categoryIds
    await attribute.save()

    return response.ok(attribute.toAdminJSON())
  }

  async setStatus({ params, request, response }: HttpContext) {
    const attribute = await ProductAttribute.find(params.id)
    if (!attribute) {
      return response.notFound({ errors: [{ field: 'id', message: 'ویژگی یافت نشد' }] })
    }
    const { status } = await request.validateUsing(attributeStatusValidator)
    attribute.status = status
    await attribute.save()
    return response.ok(attribute.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const attribute = await ProductAttribute.find(params.id)
    if (!attribute) {
      return response.notFound({ errors: [{ field: 'id', message: 'ویژگی یافت نشد' }] })
    }
    await attribute.delete()
    return response.ok({ message: 'ویژگی حذف شد' })
  }
}
