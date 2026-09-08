import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { toPublicMediaUrl } from '#utils/media_upload'

export type MediaKind = 'image' | 'video' | 'document' | 'other'

function parseUsageHints(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

export function mediaKindFromMime(mime: string): MediaKind {
  const m = String(mime || '').toLowerCase()
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('video/')) return 'video'
  if (
    m.includes('pdf')
    || m.includes('document')
    || m.includes('sheet')
    || m.includes('msword')
    || m.includes('officedocument')
    || m.startsWith('text/')
  ) {
    return 'document'
  }
  return 'other'
}

export default class MediaAsset extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'media_assets'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare url: string

  @column()
  declare filename: string

  @column()
  declare mimeType: string

  @column()
  declare kind: MediaKind

  @column()
  declare alt: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare width: number | null

  @column()
  declare height: number | null

  @column()
  declare sizeBytes: number | null

  @column({
    prepare: (value: string[] | null) => JSON.stringify(Array.isArray(value) ? value : []),
    consume: (value: unknown) => parseUsageHints(value),
  })
  declare usageHints: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  toAdminJSON() {
    return {
      id: this.id,
      url: toPublicMediaUrl(this.url),
      filename: this.filename,
      mimeType: this.mimeType,
      kind: this.kind,
      alt: this.alt || '',
      title: this.title || '',
      description: this.description || '',
      width: this.width == null ? null : Number(this.width),
      height: this.height == null ? null : Number(this.height),
      sizeBytes: this.sizeBytes == null ? null : Number(this.sizeBytes),
      usageHints: Array.isArray(this.usageHints) ? this.usageHints : [],
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
