import Brand from '#models/brand'
import Product from '#models/product'
import {
  brandStatusValidator,
  brandsQueryValidator,
  storeBrandValidator,
  updateBrandValidator,
} from '#validators/brand'
import { querySellerBrands } from '#utils/seller_brands_query'
import type { HttpContext } from '@adonisjs/core/http'
import type { SeoMeta } from '#models/blog_post'

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

function normalizeSeo(seo: Partial<SeoMeta> | null | undefined): SeoMeta | null {
  if (!seo) return null
  const next = { ...emptySeo(), ...seo }
  const hasValue = Object.entries(next).some(([key, value]) => {
    if (key === 'robots') return value !== 'index,follow'
    return Boolean(String(value || '').trim())
  })
  return hasValue ? next : null
}

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
      .slice(0, 64) || 'brand'
  )
}

export default class SellerBrandsController {
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

    const filters = await brandsQueryValidator.validate(qs)
    const result = await querySellerBrands(filters)
    return response.ok(result)
  }

  async show({ params, response }: HttpContext) {
    const brand = await Brand.find(params.id)
    if (!brand) {
      return response.notFound({ errors: [{ field: 'id', message: 'برند یافت نشد' }] })
    }
    const countRow = await Product.query().where('brand', brand.name).count('* as total').first()
    const productCount = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
    return response.ok(brand.toAdminJSON({ productCount }))
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeBrandValidator)
    const slug = payload.slug.trim().toLowerCase() || slugify(payload.name)
    const id = payload.id?.trim() || `brand-${slug}`

    const byId = await Brand.find(id)
    if (byId) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه برند تکراری است' }],
      })
    }
    const bySlug = await Brand.query().where('slug', slug).first()
    if (bySlug) {
      return response.conflict({
        errors: [{ field: 'slug', message: 'اسلاگ برند تکراری است' }],
      })
    }

    const brand = await Brand.create({
      id,
      name: payload.name.trim(),
      slug,
      logo: (payload.logo ?? '').toString().trim() || null,
      description: (payload.description ?? '').toString().trim(),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      seo: normalizeSeo(payload.seo),
    })

    return response.created(brand.toAdminJSON({ productCount: 0 }))
  }

  async update({ params, request, response }: HttpContext) {
    const brand = await Brand.find(params.id)
    if (!brand) {
      return response.notFound({ errors: [{ field: 'id', message: 'برند یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateBrandValidator)
    brand.name = payload.name.trim()
    brand.logo = (payload.logo ?? '').toString().trim() || null
    brand.description = (payload.description ?? '').toString().trim()
    brand.status = payload.status === 'inactive' ? 'inactive' : 'active'
    brand.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    brand.seo = normalizeSeo(payload.seo)
    await brand.save()

    const countRow = await Product.query().where('brand', brand.name).count('* as total').first()
    const productCount = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
    return response.ok(brand.toAdminJSON({ productCount }))
  }

  async setStatus({ params, request, response }: HttpContext) {
    const brand = await Brand.find(params.id)
    if (!brand) {
      return response.notFound({ errors: [{ field: 'id', message: 'برند یافت نشد' }] })
    }
    const { status } = await request.validateUsing(brandStatusValidator)
    brand.status = status
    await brand.save()
    return response.ok(brand.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const brand = await Brand.find(params.id)
    if (!brand) {
      return response.notFound({ errors: [{ field: 'id', message: 'برند یافت نشد' }] })
    }

    const countRow = await Product.query().where('brand', brand.name).count('* as total').first()
    const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
    if (total > 0) {
      return response.conflict({
        errors: [
          {
            field: 'id',
            message: `این برند ${total} محصول دارد و قابل حذف نیست`,
          },
        ],
      })
    }

    await brand.delete()
    return response.ok({ message: 'برند حذف شد' })
  }
}
