import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import MegaMenu from '#models/mega_menu'
import MegaMenuItem from '#models/mega_menu_item'
import Category from '#models/category'

export type MegaMenuSectionStatus = 'active' | 'inactive'

export default class MegaMenuSection extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'mega_menu_sections'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare menuId: string

  @column()
  declare parentId: string | null

  @column()
  declare title: string

  @column()
  declare slug: string | null

  @column()
  declare categoryId: string | null

  @column()
  declare sortOrder: number

  @column()
  declare status: MegaMenuSectionStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => MegaMenu, { foreignKey: 'menuId' })
  declare menu: BelongsTo<typeof MegaMenu>

  @belongsTo(() => MegaMenuSection, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof MegaMenuSection>

  @hasMany(() => MegaMenuSection, { foreignKey: 'parentId' })
  declare children: HasMany<typeof MegaMenuSection>

  @hasMany(() => MegaMenuItem, { foreignKey: 'sectionId' })
  declare items: HasMany<typeof MegaMenuItem>

  @belongsTo(() => Category, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof Category>

  toAdminJSON(extras?: {
    category?: { id: string; name: string; icon: string } | null
    itemCount?: number
    childCount?: number
  }) {
    return {
      id: this.id,
      menuId: this.menuId,
      parentId: this.parentId ?? null,
      title: this.title,
      slug: this.slug ?? null,
      categoryId: this.categoryId ?? null,
      category: extras?.category ?? null,
      sortOrder: Number(this.sortOrder) || 0,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      ...(extras?.itemCount != null ? { itemCount: extras.itemCount } : {}),
      ...(extras?.childCount != null ? { childCount: extras.childCount } : {}),
    }
  }
}
