import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import MegaMenuSection from '#models/mega_menu_section'

export type MegaMenuStatus = 'active' | 'inactive'

export default class MegaMenu extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'mega_menus'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare icon: string | null

  @column()
  declare sortOrder: number

  @column()
  declare status: MegaMenuStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => MegaMenuSection, { foreignKey: 'menuId' })
  declare sections: HasMany<typeof MegaMenuSection>

  toAdminJSON(extras?: { sectionCount?: number }) {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      icon: this.icon ?? null,
      sortOrder: Number(this.sortOrder) || 0,
      status: this.status === 'inactive' ? 'inactive' : 'active',
      createdAt: this.createdAt?.toISO() ?? null,
      updatedAt: this.updatedAt?.toISO() ?? null,
      ...(extras?.sectionCount != null ? { sectionCount: extras.sectionCount } : {}),
    }
  }
}
