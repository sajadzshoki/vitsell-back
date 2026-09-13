import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import db from '@adonisjs/lucid/services/db'
import MegaMenu from '#models/mega_menu'
import MegaMenuSection from '#models/mega_menu_section'
import MegaMenuItem from '#models/mega_menu_item'
import {
  normalizeMegaMenuFilter,
  type MegaMenuFilterDefinition,
} from '#utils/mega_menu_filter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedDir = join(__dirname, '../seed_data')

type SeedItem = {
  id: string
  title: string
  slug?: string | null
  type: 'category' | 'filter' | 'link'
  categoryId?: string | null
  filter?: MegaMenuFilterDefinition | null
  url?: string | null
  sortOrder?: number
  status?: 'active' | 'inactive'
}

type SeedSection = {
  id: string
  title: string
  slug?: string | null
  categoryId?: string | null
  sortOrder?: number
  status?: 'active' | 'inactive'
  items?: SeedItem[]
  sections?: SeedSection[]
}

type SeedMenu = {
  id: string
  title: string
  slug: string
  icon?: string | null
  sortOrder?: number
  status?: 'active' | 'inactive'
  sections?: SeedSection[]
}

type SeedFile = {
  replaceDemoIds?: boolean
  menus: SeedMenu[]
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(seedDir, name), 'utf8')) as T
}

/**
 * Demo mega-menu tree for storefront 3-column hover QA.
 * Safe to re-run: upserts fixed IDs and clears leftover test menus.
 */
export default class extends BaseSeeder {
  async run() {
    const data = loadJson<SeedFile>('mega-menu.json')
    const keepMenuIds = new Set(data.menus.map((m) => m.id))

    // Drop leftover test / previous demo menus not in this seed.
    if (data.replaceDemoIds !== false) {
      const existing = await MegaMenu.query()
      for (const menu of existing) {
        if (!keepMenuIds.has(menu.id)) {
          await menu.delete()
        }
      }
    }

    for (const [menuIndex, menu] of data.menus.entries()) {
      await MegaMenu.updateOrCreate(
        { id: menu.id },
        {
          id: menu.id,
          title: menu.title,
          slug: menu.slug,
          icon: menu.icon ?? null,
          sortOrder: menu.sortOrder ?? menuIndex,
          status: menu.status === 'inactive' ? 'inactive' : 'active',
        }
      )

      // Rebuild sections/items for this menu so nested tree stays consistent.
      await db.from('mega_menu_sections').where('menu_id', menu.id).delete()

      await this.seedSections(menu.id, null, menu.sections || [])
    }
  }

  private async seedSections(
    menuId: string,
    parentId: string | null,
    sections: SeedSection[]
  ) {
    for (const [index, section] of sections.entries()) {
      await MegaMenuSection.create({
        id: section.id,
        menuId,
        parentId,
        title: section.title,
        slug: section.slug?.trim() || section.id,
        categoryId: section.categoryId ?? null,
        sortOrder: section.sortOrder ?? index,
        status: section.status === 'inactive' ? 'inactive' : 'active',
      })

      for (const [itemIndex, item] of (section.items || []).entries()) {
        const filter =
          item.type === 'filter' ? normalizeMegaMenuFilter(item.filter) : null

        await MegaMenuItem.create({
          id: item.id,
          sectionId: section.id,
          title: item.title,
          slug: item.slug?.trim() || item.id,
          type: item.type,
          categoryId: item.type === 'category' ? item.categoryId || null : null,
          filter,
          url: item.type === 'link' ? item.url || null : null,
          sortOrder: item.sortOrder ?? itemIndex,
          status: item.status === 'inactive' ? 'inactive' : 'active',
        })
      }

      if (section.sections?.length) {
        await this.seedSections(menuId, section.id, section.sections)
      }
    }
  }
}
