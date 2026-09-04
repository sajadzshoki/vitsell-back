import Warehouse from '#models/warehouse'
import {
  storeWarehouseValidator,
  updateWarehouseValidator,
  warehousesQueryValidator,
} from '#validators/inventory'
import {
  clearDefaultWarehouses,
  querySellerWarehouses,
} from '#utils/seller_warehouses_query'
import type { HttpContext } from '@adonisjs/core/http'

function slugifyCode(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'wh'
  )
}

export default class SellerWarehousesController {
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

    const filters = await warehousesQueryValidator.validate(qs)
    return response.ok(await querySellerWarehouses(filters))
  }

  async show({ params, response }: HttpContext) {
    const warehouse = await Warehouse.find(params.id)
    if (!warehouse) {
      return response.notFound({ errors: [{ field: 'id', message: 'انبار یافت نشد' }] })
    }
    return response.ok(warehouse.toAdminJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeWarehouseValidator)
    const code = payload.code.trim().toUpperCase()
    const id = payload.id?.trim() || `wh-${slugifyCode(code)}`

    if (await Warehouse.find(id)) {
      return response.conflict({
        errors: [{ field: 'id', message: 'شناسه انبار تکراری است' }],
      })
    }
    if (await Warehouse.query().where('code', code).first()) {
      return response.conflict({
        errors: [{ field: 'code', message: 'کد انبار تکراری است' }],
      })
    }

    const isDefault = payload.isDefault === true
    if (isDefault) await clearDefaultWarehouses()

    const count = await Warehouse.query().count('* as total').first()
    const total = Number((count as any)?.$extras?.total ?? (count as any)?.total ?? 0)

    const warehouse = await Warehouse.create({
      id,
      name: payload.name.trim(),
      code,
      city: (payload.city ?? '').toString().trim(),
      address: (payload.address ?? '').toString().trim(),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      isDefault: isDefault || total === 0,
    })

    return response.created(warehouse.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const warehouse = await Warehouse.find(params.id)
    if (!warehouse) {
      return response.notFound({ errors: [{ field: 'id', message: 'انبار یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateWarehouseValidator)
    const code = payload.code.trim().toUpperCase()
    const dup = await Warehouse.query().where('code', code).whereNot('id', warehouse.id).first()
    if (dup) {
      return response.conflict({
        errors: [{ field: 'code', message: 'کد انبار تکراری است' }],
      })
    }

    if (payload.isDefault === true) await clearDefaultWarehouses(warehouse.id)

    warehouse.name = payload.name.trim()
    warehouse.code = code
    warehouse.city = (payload.city ?? '').toString().trim()
    warehouse.address = (payload.address ?? '').toString().trim()
    warehouse.status = payload.status === 'inactive' ? 'inactive' : 'active'
    if (payload.isDefault != null) warehouse.isDefault = payload.isDefault
    await warehouse.save()

    return response.ok(warehouse.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const warehouse = await Warehouse.find(params.id)
    if (!warehouse) {
      return response.notFound({ errors: [{ field: 'id', message: 'انبار یافت نشد' }] })
    }
    if (warehouse.isDefault) {
      return response.conflict({
        errors: [{ field: 'id', message: 'انبار پیش‌فرض قابل حذف نیست' }],
      })
    }
    await warehouse.delete()
    return response.ok({ message: 'انبار حذف شد' })
  }
}
