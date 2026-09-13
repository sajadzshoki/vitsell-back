import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MegaMenuSection from '#models/mega_menu_section'
import Category from '#models/category'
import {
  parseStoredFilter,
  type MegaMenuFilterDefinition,
} from '#utils/mega_menu_filter'

export type MegaMenuItemType = 'category' | 'filter' | 'link'
export type MegaMenuItemStatus = 'active' | 'inactive'

export default class MegaMenuItem extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'mega_menu_items'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sectionId: string

  @column()
  declare title: string

  @column()
  declare slug: string | null

  @column()
  declare type: MegaMenuItemType

  @column()
  declare categoryId: string | null

  @column({
    prepare: (value: MegaMenuFilterDefinition | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: unknown) => parseStoredFilter(value),
  })
  declare filter: MegaMenuFilterDefinition | null

  @column()
  declare url: string | null

  @column()
  declare sortOrder: number

  @column()
  declare status: MegaMenuItemStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => MegaMenuSection, { foreignKey: 'sectionId' })
  declare section: BelongsTo<typeof MegaMenuSection>

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof Category>

  toAdminJSON(extras?: {
    category?: { id: string; name: string; icon: string } | null
  }) {
    return {
      id: this.id,
      sectionId: this.sectionId,
      title: this.title,
      slug: this.slug ?? null,
      type: this.type,
      categoryId: this.categoryId ?? null,
      category: extras?.category ?? null,
      filter: this.filter ?? null,
      url: this.url ?? null,
      sortOrder: Number(this.sortOrder) || 0,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
    }
  }
}
