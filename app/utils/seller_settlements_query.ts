import SellerPayout, {
  type SellerSettlementStatus,
} from '#models/seller_payout'
import type { SettlementsQuery } from '#validators/settlements'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type PayoutQuery = ModelQueryBuilderContract<typeof SellerPayout, SellerPayout>

function applyFilters(query: PayoutQuery, filters: SettlementsQuery) {
  let q = query
  if (filters.status && filters.status !== 'all') {
    q = q.where('settlement_status', filters.status)
  }
  if (filters.source && filters.source !== 'all') {
    q = q.where('source', filters.source)
  }
  if (filters.gateway?.trim() && filters.gateway !== 'all') {
    q = q.whereILike('gateway', filters.gateway.trim())
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('gateway', like)
        .orWhereILike('reference', like)
        .orWhereILike('note', like)
        .orWhereILike('date', like)
    })
  }
  return q
}

async function statusCounts(filters: SettlementsQuery) {
  const base = () => applyFilters(SellerPayout.query(), { ...filters, status: undefined })
  const statuses: SellerSettlementStatus[] = [
    'pending',
    'processing',
    'completed',
    'failed',
    'reconciled',
  ]
  const [allRow, ...rows] = await Promise.all([
    base().count('* as total').first(),
    ...statuses.map((status) => base().where('settlement_status', status).count('* as total').first()),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const counts: Record<string, number> = { all: num(allRow) }
  statuses.forEach((status, i) => {
    counts[status] = num(rows[i])
  })
  return counts
}

export async function querySellerSettlements(filters: SettlementsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 20)))

  const filtered = applyFilters(SellerPayout.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(SellerPayout.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const rows = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const items = rows.map((row) => row.toSettlementJSON())
  const gateways = [
    ...new Set(
      (await SellerPayout.query().select('gateway').groupBy('gateway')).map((r) =>
        String(r.gateway || '').trim(),
      ),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fa'))

  return {
    items,
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
    gatewayOptions: gateways,
  }
}

export async function findSellerSettlement(id: string) {
  const trimmed = String(id || '').trim()
  if (!trimmed) return null
  const candidates = [
    trimmed,
    trimmed.startsWith('stl-') ? trimmed.slice(4) : `stl-${trimmed}`,
  ]
  const row = await SellerPayout.query().whereIn('id', candidates).first()
  if (row) return row
  // also match stl-PO-xxxx when stored as PO-xxxx
  if (trimmed.startsWith('stl-')) {
    return SellerPayout.find(trimmed.slice(4))
  }
  return null
}

export function syncPayoutStatusFromSettlement(status: SellerSettlementStatus): 'paid' | 'pending' {
  if (status === 'completed' || status === 'reconciled') return 'paid'
  return 'pending'
}
