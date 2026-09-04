import MediaAsset from '#models/media_asset'
import type { MediaQuery } from '#validators/media_query'
import { pageWindow, parseListQs } from '#utils/seller_schedule_filters'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type MediaQueryBuilder = ModelQueryBuilderContract<typeof MediaAsset, MediaAsset>

function applyFilters(query: MediaQueryBuilder, filters: MediaQuery, includeKind = true) {
  let q = query
  if (includeKind && filters.kind && filters.kind !== 'all') {
    q = q.where('kind', filters.kind)
  }
  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('filename', like)
        .orWhereILike('title', like)
        .orWhereILike('alt', like)
        .orWhereILike('url', like)
        .orWhereILike('mime_type', like)
    })
  }
  return q
}

async function countKindBuckets(baseFactory: () => MediaQueryBuilder) {
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  const [allRow, imageRow, videoRow, documentRow, otherRow] = await Promise.all([
    baseFactory().count('* as total').first(),
    baseFactory().where('kind', 'image').count('* as total').first(),
    baseFactory().where('kind', 'video').count('* as total').first(),
    baseFactory().where('kind', 'document').count('* as total').first(),
    baseFactory().where('kind', 'other').count('* as total').first(),
  ])
  return {
    all: num(allRow),
    image: num(imageRow),
    video: num(videoRow),
    document: num(documentRow),
    other: num(otherRow),
  }
}

export function parseMediaListQs(qs: Record<string, any>) {
  const next = parseListQs(qs)
  if (next.kind === 'all' || next.kind === '') delete next.kind
  return next
}

export async function querySellerMedia(filters: MediaQuery) {
  const { wantAll, page, pageSize } = pageWindow(filters)
  const filtered = applyFilters(MediaAsset.query(), filters)
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc')

  const countRow = await applyFilters(MediaAsset.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)
  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  const statusCounts = await countKindBuckets(() => applyFilters(MediaAsset.query(), filters, false))

  return {
    items: items.map((m) => m.toAdminJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts,
  }
}
