import Product from '#models/product'
import SellerReturn from '#models/seller_return'
import { toPublicMediaUrl } from '#utils/media_upload'
import type { ReturnsQuery } from '#validators/returns'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type ReturnQuery = ModelQueryBuilderContract<typeof SellerReturn, SellerReturn>

function applyFilters(query: ReturnQuery, filters: ReturnsQuery, options?: { includeStatus?: boolean }) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  if (includeStatus && filters.status && filters.status !== 'all') {
    q = q.where('status', filters.status)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('order_id', like)
        .orWhereILike('customer_name', like)
        .orWhereILike('customer_id', like)
        .orWhereILike('reason', like)
    })
  }
  return q
}

async function statusCounts(filters: ReturnsQuery) {
  const base = () => applyFilters(SellerReturn.query(), filters, { includeStatus: false })
  const statuses = [
    'requested',
    'approved',
    'rejected',
    'received',
    'processing',
    'completed',
    'cancelled',
  ] as const
  const [allRow, ...rows] = await Promise.all([
    base().count('* as total').first(),
    ...statuses.map((status) => base().where('status', status).count('* as total').first()),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const counts: Record<string, number> = { all: num(allRow) }
  statuses.forEach((status, i) => {
    counts[status] = num(rows[i])
  })
  return counts
}

export async function querySellerReturns(filters: ReturnsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(SellerReturn.query(), filters).orderBy('requested_at', 'desc')
  const countRow = await applyFilters(SellerReturn.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: await serializeSellerReturns(items),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}

export async function serializeSellerReturns(rows: SellerReturn[]) {
  const ids = [
    ...new Set(rows.flatMap((row) => (row.items || []).map((item) => item.productId)).filter(Boolean)),
  ]
  const products = ids.length
    ? await Product.query().whereIn('id', ids).select('id', 'title', 'image', 'sku')
    : []
  const byId = new Map(products.map((product) => [product.id, product]))

  return rows.map((row) => {
    const json = row.toAdminJSON()
    return {
      ...json,
      items: json.items.map((item) => {
        const product = byId.get(item.productId)
        return {
          ...item,
          productTitle: item.productTitle || product?.title || item.productId,
          sku: item.sku || product?.sku || item.productId,
          image: product?.image ? toPublicMediaUrl(product.image) : '',
        }
      }),
    }
  })
}

export async function serializeSellerReturn(row: SellerReturn) {
  const [json] = await serializeSellerReturns([row])
  return json!
}
