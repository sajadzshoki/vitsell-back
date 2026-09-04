import StockMovement from '#models/stock_movement'
import type { MovementsQuery } from '#validators/inventory'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type MovementQuery = ModelQueryBuilderContract<typeof StockMovement, StockMovement>

function applyFilters(query: MovementQuery, filters: MovementsQuery, options?: { includeType?: boolean }) {
  let q = query
  if (options?.includeType !== false && filters.type && filters.type !== 'all') {
    q = q.where('type', filters.type)
  }
  if (filters.warehouseId?.trim() && filters.warehouseId !== 'all') {
    q = q.where('warehouse_id', filters.warehouseId.trim())
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('product_title', like)
        .orWhereILike('product_id', like)
        .orWhereILike('reason', like)
        .orWhereILike('actor_name', like)
        .orWhereILike('variant_label', like)
    })
  }
  return q
}

async function typeCounts(filters: MovementsQuery) {
  const base = () => applyFilters(StockMovement.query(), filters, { includeType: false })
  const allRow = await base().count('* as total').first()
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const types = [
    'add',
    'remove',
    'adjust',
    'reserve',
    'release',
    'return',
    'refund',
    'correction',
  ] as const
  const counts: Record<string, number> = { all: num(allRow) }
  await Promise.all(
    types.map(async (type) => {
      const row = await base().where('type', type).count('* as total').first()
      counts[type] = num(row)
    })
  )
  return counts
}

export async function querySellerMovements(filters: MovementsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 15)))

  const base = applyFilters(StockMovement.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(StockMovement.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await base.limit(pageSize)
    : await base.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((m) => m.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    typeCounts: await typeCounts(filters),
  }
}
