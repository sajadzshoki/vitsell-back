import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import type { ProductSpec } from '#models/product'

export default class CategorySpecKey extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'category_spec_keys'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare categoryId: string

  @column()
  declare key: string

  @column()
  declare usageCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof Category>

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      key: this.key,
      usageCount: Number(this.usageCount) || 0,
    }
  }
}

function slugifyKey(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
      .slice(0, 40) || 'key'
  )
}

/** Upsert category-scoped spec key suggestions from product specs. */
export async function upsertCategorySpecKeys(
  categoryId: string,
  specs: ProductSpec[] | null | undefined
) {
  const catId = categoryId.trim()
  if (!catId || !specs?.length) return

  const seen = new Set<string>()
  for (const spec of specs) {
    const key = String(spec?.key || '').trim()
    if (!key || seen.has(key)) continue
    seen.add(key)

    const existing = await CategorySpecKey.query()
      .where('category_id', catId)
      .where('key', key)
      .first()

    if (existing) {
      existing.usageCount = (Number(existing.usageCount) || 0) + 1
      await existing.save()
      continue
    }

    await CategorySpecKey.create({
      id: `csk-${catId}-${slugifyKey(key)}-${Date.now().toString(36).slice(-4)}`,
      categoryId: catId,
      key,
      usageCount: 1,
    })
  }
}
