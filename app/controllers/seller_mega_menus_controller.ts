import Category from '#models/category'
import MegaMenu from '#models/mega_menu'
import MegaMenuItem, { type MegaMenuItemType } from '#models/mega_menu_item'
import MegaMenuSection from '#models/mega_menu_section'
import { normalizeMegaMenuFilter } from '#utils/mega_menu_filter'
import { loadAdminMegaMenuTree } from '#utils/mega_menu_tree'
import {
  megaMenuStatusValidator,
  megaMenusQueryValidator,
  reorderMegaMenuValidator,
  storeMegaMenuItemValidator,
  storeMegaMenuSectionValidator,
  storeMegaMenuValidator,
  updateMegaMenuItemValidator,
  updateMegaMenuSectionValidator,
  updateMegaMenuValidator,
} from '#validators/mega_menu'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || ''
  )
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function assertLatinSlug(
  raw: string | null | undefined,
  field: string,
  response: HttpContext['response']
): string | null {
  const slug = String(raw || '')
    .trim()
    .toLowerCase()
  if (!slug) {
    response.badRequest({
      errors: [
        {
          field,
          message: 'اسلاگ الزامی است — برای عنوان فارسی یک اسلاگ انگلیسی وارد کنید (مثلاً mobile)',
        },
      ],
    })
    return null
  }
  if (!SLUG_PATTERN.test(slug)) {
    response.badRequest({
      errors: [{ field, message: 'اسلاگ باید فقط حروف انگلیسی کوچک، عدد و خط تیره باشد' }],
    })
    return null
  }
  return slug
}

function newId(prefix: string, seed: string) {
  const base = slugify(seed) || 'item'
  return `${prefix}-${base}-${Date.now().toString(36).slice(-4)}`
}

async function uniqueMenuSlug(base: string, excludeId?: string) {
  const root = slugify(base) || 'menu'
  let candidate = root
  let n = 2
  while (true) {
    const query = MegaMenu.query().where('slug', candidate)
    if (excludeId) query.whereNot('id', excludeId)
    const exists = await query.first()
    if (!exists) return candidate
    candidate = `${root}-${n}`
    n += 1
  }
}

async function uniqueSectionSlug(menuId: string, base: string, excludeId?: string) {
  const root = slugify(base) || 'section'
  let candidate = root
  let n = 2
  while (true) {
    const query = MegaMenuSection.query().where('menu_id', menuId).where('slug', candidate)
    if (excludeId) query.whereNot('id', excludeId)
    const exists = await query.first()
    if (!exists) return candidate
    candidate = `${root}-${n}`
    n += 1
  }
}

async function uniqueItemSlug(menuId: string, base: string, excludeId?: string) {
  const root = slugify(base) || 'item'
  let candidate = root
  let n = 2
  while (true) {
    const sectionIds = (await MegaMenuSection.query().where('menu_id', menuId).select('id')).map(
      (s) => s.id
    )
    if (!sectionIds.length) return candidate
    const query = MegaMenuItem.query().whereIn('section_id', sectionIds).where('slug', candidate)
    if (excludeId) query.whereNot('id', excludeId)
    const exists = await query.first()
    if (!exists) return candidate
    candidate = `${root}-${n}`
    n += 1
  }
}

async function categoryRef(categoryId: string | null | undefined) {
  if (!categoryId) return null
  const cat = await Category.find(categoryId)
  if (!cat) return null
  return { id: cat.id, name: cat.name, icon: cat.icon }
}

async function assertCategoryExists(categoryId: string | null | undefined, response: HttpContext['response']) {
  if (!categoryId) return true
  const cat = await Category.find(categoryId)
  if (!cat) {
    response.badRequest({
      errors: [{ field: 'categoryId', message: 'دسته‌بندی یافت نشد' }],
    })
    return false
  }
  return true
}

function validateItemPayload(
  type: MegaMenuItemType,
  payload: {
    categoryId?: string | null
    filter?: unknown
    url?: string | null
  },
  response: HttpContext['response']
) {
  if (type === 'category') {
    if (!payload.categoryId?.trim()) {
      response.badRequest({
        errors: [{ field: 'categoryId', message: 'برای آیتم دسته‌بندی، categoryId الزامی است' }],
      })
      return null
    }
    return {
      categoryId: payload.categoryId.trim(),
      filter: null as null,
      url: null as null,
    }
  }

  if (type === 'filter') {
    const filter = normalizeMegaMenuFilter(payload.filter)
    if (!filter) {
      response.badRequest({
        errors: [
          {
            field: 'filter',
            message:
              'برای آیتم فیلتر، حداقل یکی از category / brands / minPrice / maxPrice / attrs / q لازم است',
          },
        ],
      })
      return null
    }
    return {
      categoryId: null as null,
      filter,
      url: null as null,
    }
  }

  const url = (payload.url || '').trim()
  if (!url) {
    response.badRequest({
      errors: [{ field: 'url', message: 'برای آیتم لینک، url الزامی است' }],
    })
    return null
  }
  return {
    categoryId: null as null,
    filter: null as null,
    url,
  }
}

async function applyReorder(table: string, orderedIds: string[], where?: { column: string; value: string }) {
  await db.transaction(async (trx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const query = trx.from(table).where('id', orderedIds[i])
      if (where) query.andWhere(where.column, where.value)
      await query.update({ sort_order: i, updated_at: new Date() })
    }
  })
}

export default class SellerMegaMenusController {
  // ── Menus ──────────────────────────────────────────────────────────

  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    const filters = await megaMenusQueryValidator.validate(qs)

    let query = MegaMenu.query().orderBy('sort_order', 'asc').orderBy('title', 'asc')
    if (filters.status === 'active' || filters.status === 'inactive') {
      query = query.where('status', filters.status)
    }
    if (filters.q?.trim()) {
      const like = `%${filters.q.trim()}%`
      query = query.where((b) => b.whereILike('title', like).orWhereILike('slug', like))
    }

    const menus = await query
    const counts = await db
      .from('mega_menu_sections')
      .whereNull('parent_id')
      .groupBy('menu_id')
      .select('menu_id')
      .count('* as total')

    const countByMenu = new Map<string, number>()
    for (const row of counts as Array<{ menu_id: string; total: string | number }>) {
      countByMenu.set(String(row.menu_id), Number(row.total) || 0)
    }

    return response.ok({
      items: menus.map((m) => m.toAdminJSON({ sectionCount: countByMenu.get(m.id) || 0 })),
    })
  }

  async show({ params, response }: HttpContext) {
    const tree = await loadAdminMegaMenuTree(params.id)
    if (!tree) {
      return response.notFound({ errors: [{ field: 'id', message: 'منوی مگا یافت نشد' }] })
    }
    return response.ok(tree)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeMegaMenuValidator)
    const requested = (payload.slug?.trim() || slugify(payload.title) || '').toLowerCase()
    const slugBase = assertLatinSlug(requested || null, 'slug', response)
    if (!slugBase) return
    const slug = await uniqueMenuSlug(slugBase)
    const id = payload.id?.trim() || newId('mm', slug)

    if (await MegaMenu.find(id)) {
      return response.conflict({ errors: [{ field: 'id', message: 'شناسه منو تکراری است' }] })
    }

    const menu = await MegaMenu.create({
      id,
      title: payload.title.trim(),
      slug,
      icon: (payload.icon ?? '').toString().trim() || null,
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    })

    return response.created(menu.toAdminJSON({ sectionCount: 0 }))
  }

  async update({ params, request, response }: HttpContext) {
    const menu = await MegaMenu.find(params.id)
    if (!menu) {
      return response.notFound({ errors: [{ field: 'id', message: 'منوی مگا یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateMegaMenuValidator)
    if (payload.slug != null && String(payload.slug).trim()) {
      const slugBase = assertLatinSlug(String(payload.slug).trim(), 'slug', response)
      if (!slugBase) return
      menu.slug = await uniqueMenuSlug(slugBase, menu.id)
    }

    menu.title = payload.title.trim()
    menu.icon = (payload.icon ?? '').toString().trim() || null
    if (payload.sortOrder != null) {
      menu.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    }
    if (payload.status) {
      menu.status = payload.status === 'inactive' ? 'inactive' : 'active'
    }
    await menu.save()

    const tree = await loadAdminMegaMenuTree(menu.id)
    return response.ok(tree)
  }

  async setStatus({ params, request, response }: HttpContext) {
    const menu = await MegaMenu.find(params.id)
    if (!menu) {
      return response.notFound({ errors: [{ field: 'id', message: 'منوی مگا یافت نشد' }] })
    }
    const { status } = await request.validateUsing(megaMenuStatusValidator)
    menu.status = status
    await menu.save()
    return response.ok(menu.toAdminJSON())
  }

  async reorder({ request, response }: HttpContext) {
    const { orderedIds } = await request.validateUsing(reorderMegaMenuValidator)
    await applyReorder('mega_menus', orderedIds)
    return response.ok({ message: 'ترتیب منوها به‌روز شد' })
  }

  async destroy({ params, response }: HttpContext) {
    const menu = await MegaMenu.find(params.id)
    if (!menu) {
      return response.notFound({ errors: [{ field: 'id', message: 'منوی مگا یافت نشد' }] })
    }
    await menu.delete()
    return response.ok({ message: 'منوی مگا حذف شد' })
  }

  // ── Sections ───────────────────────────────────────────────────────

  async storeSection({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeMegaMenuSectionValidator)
    const menu = await MegaMenu.find(payload.menuId)
    if (!menu) {
      return response.badRequest({ errors: [{ field: 'menuId', message: 'منوی مگا یافت نشد' }] })
    }

    const parentId = payload.parentId?.trim() || null
    if (parentId) {
      const parent = await MegaMenuSection.find(parentId)
      if (!parent || parent.menuId !== menu.id) {
        return response.badRequest({
          errors: [{ field: 'parentId', message: 'بخش والد نامعتبر است' }],
        })
      }
    }

    const categoryId = payload.categoryId?.trim() || null
    if (!(await assertCategoryExists(categoryId, response))) return

    const id = payload.id?.trim() || newId('mms', payload.title)
    if (await MegaMenuSection.find(id)) {
      return response.conflict({ errors: [{ field: 'id', message: 'شناسه بخش تکراری است' }] })
    }

    const slugBase = assertLatinSlug(
      payload.slug?.trim() || slugify(payload.title) || null,
      'slug',
      response
    )
    if (!slugBase) return
    const slug = await uniqueSectionSlug(menu.id, slugBase)

    const section = await MegaMenuSection.create({
      id,
      menuId: menu.id,
      parentId,
      title: payload.title.trim(),
      slug,
      categoryId,
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    })

    return response.created(
      section.toAdminJSON({
        category: await categoryRef(section.categoryId),
        itemCount: 0,
        childCount: 0,
      })
    )
  }

  async updateSection({ params, request, response }: HttpContext) {
    const section = await MegaMenuSection.find(params.id)
    if (!section) {
      return response.notFound({ errors: [{ field: 'id', message: 'بخش منو یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateMegaMenuSectionValidator)

    if (payload.parentId !== undefined) {
      const parentId = payload.parentId?.trim() || null
      if (parentId === section.id) {
        return response.badRequest({
          errors: [{ field: 'parentId', message: 'بخش نمی‌تواند والد خودش باشد' }],
        })
      }
      if (parentId) {
        const parent = await MegaMenuSection.find(parentId)
        if (!parent || parent.menuId !== section.menuId) {
          return response.badRequest({
            errors: [{ field: 'parentId', message: 'بخش والد نامعتبر است' }],
          })
        }
        // Prevent cycles: walk up from parent
        let cursor: MegaMenuSection | null = parent
        while (cursor) {
          if (cursor.id === section.id) {
            return response.badRequest({
              errors: [{ field: 'parentId', message: 'ایجاد حلقه در سلسله‌مراتب بخش‌ها مجاز نیست' }],
            })
          }
          cursor = cursor.parentId ? await MegaMenuSection.find(cursor.parentId) : null
        }
      }
      section.parentId = parentId
    }

    if (payload.categoryId !== undefined) {
      const categoryId = payload.categoryId?.trim() || null
      if (!(await assertCategoryExists(categoryId, response))) return
      section.categoryId = categoryId
    }

    section.title = payload.title.trim()
    if (payload.slug !== undefined) {
      const slugBase = assertLatinSlug(
        payload.slug?.trim() || slugify(payload.title) || null,
        'slug',
        response
      )
      if (!slugBase) return
      section.slug = await uniqueSectionSlug(section.menuId, slugBase, section.id)
    }
    if (payload.sortOrder != null) {
      section.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    }
    if (payload.status) {
      section.status = payload.status === 'inactive' ? 'inactive' : 'active'
    }
    await section.save()

    const itemCount = await MegaMenuItem.query().where('section_id', section.id).count('* as total')
    const childCount = await MegaMenuSection.query().where('parent_id', section.id).count('* as total')

    return response.ok(
      section.toAdminJSON({
        category: await categoryRef(section.categoryId),
        itemCount: Number((itemCount[0] as any)?.$extras?.total ?? 0),
        childCount: Number((childCount[0] as any)?.$extras?.total ?? 0),
      })
    )
  }

  async setSectionStatus({ params, request, response }: HttpContext) {
    const section = await MegaMenuSection.find(params.id)
    if (!section) {
      return response.notFound({ errors: [{ field: 'id', message: 'بخش منو یافت نشد' }] })
    }
    const { status } = await request.validateUsing(megaMenuStatusValidator)
    section.status = status
    await section.save()
    return response.ok(section.toAdminJSON({ category: await categoryRef(section.categoryId) }))
  }

  async reorderSections({ request, response }: HttpContext) {
    const { orderedIds } = await request.validateUsing(reorderMegaMenuValidator)
    await applyReorder('mega_menu_sections', orderedIds)
    return response.ok({ message: 'ترتیب بخش‌ها به‌روز شد' })
  }

  async destroySection({ params, response }: HttpContext) {
    const section = await MegaMenuSection.find(params.id)
    if (!section) {
      return response.notFound({ errors: [{ field: 'id', message: 'بخش منو یافت نشد' }] })
    }
    await section.delete()
    return response.ok({ message: 'بخش منو حذف شد' })
  }

  // ── Items ──────────────────────────────────────────────────────────

  async storeItem({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeMegaMenuItemValidator)
    const section = await MegaMenuSection.find(payload.sectionId)
    if (!section) {
      return response.badRequest({ errors: [{ field: 'sectionId', message: 'بخش منو یافت نشد' }] })
    }

    const type = payload.type as MegaMenuItemType
    const normalized = validateItemPayload(type, payload, response)
    if (!normalized) return

    if (type === 'category' && !(await assertCategoryExists(normalized.categoryId, response))) return
    if (type === 'filter' && normalized.filter?.category) {
      if (!(await assertCategoryExists(normalized.filter.category, response))) return
    }

    const id = payload.id?.trim() || newId('mmi', payload.title)
    if (await MegaMenuItem.find(id)) {
      return response.conflict({ errors: [{ field: 'id', message: 'شناسه آیتم تکراری است' }] })
    }

    const slugBase = assertLatinSlug(
      payload.slug?.trim() || slugify(payload.title) || null,
      'slug',
      response
    )
    if (!slugBase) return
    const slug = await uniqueItemSlug(section.menuId, slugBase)

    const item = await MegaMenuItem.create({
      id,
      sectionId: section.id,
      title: payload.title.trim(),
      slug,
      type,
      categoryId: normalized.categoryId,
      filter: normalized.filter,
      url: normalized.url,
      sortOrder: Math.max(0, Math.round(Number(payload.sortOrder) || 0)),
      status: payload.status === 'inactive' ? 'inactive' : 'active',
    })

    return response.created(
      item.toAdminJSON({
        category: await categoryRef(item.categoryId),
      })
    )
  }

  async updateItem({ params, request, response }: HttpContext) {
    const item = await MegaMenuItem.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'آیتم منو یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateMegaMenuItemValidator)
    const type = payload.type as MegaMenuItemType
    const normalized = validateItemPayload(type, payload, response)
    if (!normalized) return

    if (type === 'category' && !(await assertCategoryExists(normalized.categoryId, response))) return
    if (type === 'filter' && normalized.filter?.category) {
      if (!(await assertCategoryExists(normalized.filter.category, response))) return
    }

    item.title = payload.title.trim()
    item.type = type
    if (payload.slug !== undefined) {
      const slugBase = assertLatinSlug(
        payload.slug?.trim() || slugify(payload.title) || null,
        'slug',
        response
      )
      if (!slugBase) return
      const section = await MegaMenuSection.find(item.sectionId)
      if (!section) {
        return response.badRequest({
          errors: [{ field: 'sectionId', message: 'بخش منو یافت نشد' }],
        })
      }
      item.slug = await uniqueItemSlug(section.menuId, slugBase, item.id)
    }
    item.categoryId = normalized.categoryId
    item.filter = normalized.filter
    item.url = normalized.url
    if (payload.sortOrder != null) {
      item.sortOrder = Math.max(0, Math.round(Number(payload.sortOrder) || 0))
    }
    if (payload.status) {
      item.status = payload.status === 'inactive' ? 'inactive' : 'active'
    }
    await item.save()

    return response.ok(
      item.toAdminJSON({
        category: await categoryRef(item.categoryId),
      })
    )
  }

  async setItemStatus({ params, request, response }: HttpContext) {
    const item = await MegaMenuItem.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'آیتم منو یافت نشد' }] })
    }
    const { status } = await request.validateUsing(megaMenuStatusValidator)
    item.status = status
    await item.save()
    return response.ok(item.toAdminJSON({ category: await categoryRef(item.categoryId) }))
  }

  async reorderItems({ request, response }: HttpContext) {
    const { orderedIds } = await request.validateUsing(reorderMegaMenuValidator)
    await applyReorder('mega_menu_items', orderedIds)
    return response.ok({ message: 'ترتیب آیتم‌ها به‌روز شد' })
  }

  async destroyItem({ params, response }: HttpContext) {
    const item = await MegaMenuItem.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'آیتم منو یافت نشد' }] })
    }
    await item.delete()
    return response.ok({ message: 'آیتم منو حذف شد' })
  }
}
