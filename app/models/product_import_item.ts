import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ProductImportBatch from '#models/product_import_batch'

export default class ProductImportItem extends BaseModel {
  static table = 'product_import_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare batchId: number

  @column()
  declare source: string

  @column()
  declare sourceUrl: string

  @column()
  declare sourceProductId: string | null

  @column()
  declare status: string

  @column()
  declare productId: string | null

  @column()
  declare errorCode: string | null

  @column()
  declare errorMessage: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string[] | string | null) => {
      if (!value) return []
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare warnings: string[]

  @column({
    prepare: (value: unknown) => (value != null ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (value == null) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare result: unknown

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ProductImportBatch, { foreignKey: 'batchId' })
  declare batch: BelongsTo<typeof ProductImportBatch>

  toAdminJSON() {
    return {
      id: this.id,
      batchId: this.batchId,
      source: this.source,
      sourceUrl: this.sourceUrl,
      sourceProductId: this.sourceProductId,
      status: this.status,
      productId: this.productId,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      warnings: this.warnings || [],
      result: this.result,
      startedAt: this.startedAt?.toISO() ?? null,
      finishedAt: this.finishedAt?.toISO() ?? null,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
