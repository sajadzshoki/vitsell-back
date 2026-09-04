import Warehouse from '#models/warehouse'
import type { WarehousesQuery } from '#validators/inventory'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type WarehouseQuery = ModelQueryBuilderContract<typeof Warehouse, Warehouse>

function applyFilters(query: WarehouseQuery, filters: WarehousesQuery, options?: { includeStatus?: boolean }) {
  let q = query
  if (options?.includeStatus !== false && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('name', like)
        .orWhereILike('code', like)
        .orWhereILike('city', like)
        .orWhereILike('address', like)
        .orWhereILike('id', like)
    })
  }
  return q
}

async function statusCounts(filters: WarehousesQuery) {
  const base = () => applyFilters(Warehouse.query(), filters, { includeStatus: false })
  const [allRow, activeRow, inactiveRow] = await Promise.all([
    base().count('* as total').first(),
    base().where('status', 'active').count('* as total').first(),
    base().where('status', 'inactive').count('* as total').first(),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return { all: num(allRow), active: num(activeRow), inactive: num(inactiveRow) }
}

export async function querySellerWarehouses(filters: WarehousesQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 50)))

  const base = applyFilters(Warehouse.query(), filters)
    .orderBy('is_default', 'desc')
    .orderBy('name', 'asc')

  const countRow = await applyFilters(Warehouse.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await base.limit(pageSize)
    : await base.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((w) => w.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}

export async function clearDefaultWarehouses(exceptId?: string) {
  const q = Warehouse.query().where('is_default', true)
  if (exceptId) q.whereNot('id', exceptId)
  await q.update({ isDefault: false })
}

export async function resolveDefaultWarehouseId() {
  const def = await Warehouse.query().where('is_default', true).where('status', 'active').first()
  if (def) return def.id
  const any = await Warehouse.query().where('status', 'active').orderBy('name', 'asc').first()
  return any?.id ?? 'wh-tehran'
}
