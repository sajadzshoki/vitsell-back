import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ProductImportItem from '#models/product_import_item'

export default class ProductImportBatch extends BaseModel {
  static table = 'product_import_batches'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare source: string

  @column()
  declare status: string

  @column()
  declare mode: string

  @column({
    prepare: (value: Record<string, unknown> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: Record<string, unknown> | string | null) => {
      if (!value) return null
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare config: Record<string, unknown> | null

  @column()
  declare totalCount: number

  @column()
  declare successCount: number

  @column()
  declare failedCount: number

  @column()
  declare duplicateCount: number

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => ProductImportItem, { foreignKey: 'batchId' })
  declare items: HasMany<typeof ProductImportItem>

  toAdminJSON(items?: ProductImportItem[]) {
    return {
      id: this.id,
      source: this.source,
      status: this.status,
      mode: this.mode,
      config: this.config,
      totalCount: this.totalCount,
      successCount: this.successCount,
      failedCount: this.failedCount,
      duplicateCount: this.duplicateCount,
      startedAt: this.startedAt?.toISO() ?? null,
      finishedAt: this.finishedAt?.toISO() ?? null,
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      ...(items
        ? {
            items: items.map((i) => i.toAdminJSON()),
          }
        : {}),
    }
  }
}
