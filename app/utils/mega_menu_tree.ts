import Category from '#models/category'
import MegaMenu from '#models/mega_menu'
import MegaMenuItem from '#models/mega_menu_item'
import MegaMenuSection from '#models/mega_menu_section'
import type { MegaMenuFilterDefinition } from '#utils/mega_menu_filter'

export type PublicCategoryRef = {
  id: string
  name: string
  icon: string
  image: string | null
}

export type PublicMegaMenuItem = {
  id: string
  title: string
  slug: string | null
  type: 'category' | 'filter' | 'link'
  sortOrder: number
  href?: string
  category?: PublicCategoryRef
  filter?: MegaMenuFilterDefinition
  url?: string
}

export type PublicMegaMenuSection = {
  id: string
  title: string
  slug: string | null
  sortOrder: number
  href?: string
  category?: PublicCategoryRef
  items: PublicMegaMenuItem[]
  sections: PublicMegaMenuSection[]
}

export type PublicMegaMenu = {
  id: string
  title: string
  slug: string
  icon: string | null
  sortOrder: number
  href?: string
  sections: PublicMegaMenuSection[]
}

export type MegaMenuResolveResult = {
  path: string
  title: string
  type: 'menu' | 'section' | 'item'
  category: string | null
  filter: MegaMenuFilterDefinition | null
  href: string
}

function categoryRef(cat: Category | undefined): PublicCategoryRef | undefined {
  if (!cat) return undefined
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    image: cat.image ?? null,
  }
}

function sortByOrder<T extends { sortOrder: number; title?: string; id?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const diff = (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    if (diff !== 0) return diff
    return String(a.title || a.id || '').localeCompare(String(b.title || b.id || ''), 'fa')
  })
}

function slugOrId(slug: string | null | undefined, id: string) {
  const s = String(slug || '').trim()
  return s || id
}

/** Digikala-style listing path used by the storefront Nuxt app. */
function toSearchCategoryPath(categoryId: string) {
  return `/search/category-${encodeURIComponent(String(categoryId || '').trim())}`
}

/** Build storefront search href from a catalog filter (relative path + query). */
function buildSearchHref(input: {
  category?: string | null
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  attrs?: Record<string, string[]>
  q?: string
  onlyDiscount?: boolean
  onlyInStock?: boolean
  fastDelivery?: boolean
  minRating?: number
}): string {
  const category = String(input.category || '').trim()
  const params = new URLSearchParams()
  const q = String(input.q || '').trim()
  if (q) params.set('q', q)
  const brands = (input.brands || []).map((b) => String(b).trim()).filter(Boolean)
  if (brands.length === 1) params.set('brands', brands[0]!)
  else if (brands.length > 1) params.set('brands', brands.join(','))
  const minPrice = Number(input.minPrice || 0) || 0
  const maxPrice = Number(input.maxPrice || 0) || 0
  if (minPrice > 0) params.set('minPrice', String(minPrice))
  if (maxPrice > 0) params.set('maxPrice', String(maxPrice))
  if (input.attrs && Object.keys(input.attrs).length) {
    params.set('attrs', JSON.stringify(input.attrs))
  }
  if (input.onlyDiscount) params.set('onlyDiscount', '1')
  if (input.onlyInStock) params.set('onlyInStock', '1')
  if (input.fastDelivery) params.set('fastDelivery', '1')
  const minRating = Number(input.minRating || 0) || 0
  if (minRating > 0) params.set('minRating', String(minRating))

  const path = category ? toSearchCategoryPath(category) : '/search'
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Legacy SEO path for `/category/...` resolve (bookmarks / deep links). */
function joinCategoryPath(parts: string[]) {
  return `/category/${parts.map((p) => encodeURIComponent(p)).join('/')}`
}

function firstCategoryId(sections: PublicMegaMenuSection[]): string | null {
  for (const section of sections) {
    if (section.category?.id) return section.category.id
    const nested = firstCategoryId(section.sections)
    if (nested) return nested
    for (const item of section.items) {
      if (item.type === 'category' && item.category?.id) return item.category.id
      if (item.type === 'filter' && item.filter?.category) return item.filter.category
    }
  }
  return null
}

export async function loadPublicMegaMenuTree(): Promise<{ items: PublicMegaMenu[] }> {
  const menus = await MegaMenu.query()
    .where('status', 'active')
    .orderBy('sort_order', 'asc')
    .orderBy('title', 'asc')

  if (!menus.length) return { items: [] }

  const menuIds = menus.map((m) => m.id)
  const sections = await MegaMenuSection.query()
    .whereIn('menu_id', menuIds)
    .where('status', 'active')
    .orderBy('sort_order', 'asc')

  const sectionIds = sections.map((s) => s.id)
  const items = sectionIds.length
    ? await MegaMenuItem.query()
        .whereIn('section_id', sectionIds)
        .where('status', 'active')
        .orderBy('sort_order', 'asc')
    : []

  const categoryIds = new Set<string>()
  for (const s of sections) {
    if (s.categoryId) categoryIds.add(s.categoryId)
  }
  for (const item of items) {
    if (item.type === 'category' && item.categoryId) categoryIds.add(item.categoryId)
    if (item.type === 'filter' && item.filter?.category) categoryIds.add(item.filter.category)
  }

  const categories = categoryIds.size
    ? await Category.query().whereIn('id', [...categoryIds]).where('status', 'active')
    : []
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const itemsBySection = new Map<string, MegaMenuItem[]>()
  for (const item of items) {
    const list = itemsBySection.get(item.sectionId) || []
    list.push(item)
    itemsBySection.set(item.sectionId, list)
  }

  const sectionsByMenu = new Map<string, MegaMenuSection[]>()
  for (const section of sections) {
    const list = sectionsByMenu.get(section.menuId) || []
    list.push(section)
    sectionsByMenu.set(section.menuId, list)
  }

  function mapItem(item: MegaMenuItem, pathParts: string[]): PublicMegaMenuItem | null {
    const base: PublicMegaMenuItem = {
      id: item.id,
      title: item.title,
      slug: item.slug ?? null,
      type: item.type,
      sortOrder: Number(item.sortOrder) || 0,
    }

    if (item.type === 'category') {
      const cat = item.categoryId ? categoryById.get(item.categoryId) : undefined
      if (!cat) return null
      return {
        ...base,
        href: toSearchCategoryPath(cat.id),
        category: categoryRef(cat)!,
      }
    }

    if (item.type === 'filter') {
      const filter = item.filter
      if (!filter) return null
      if (filter.category && !categoryById.has(filter.category)) {
        return null
      }
      return {
        ...base,
        href: buildSearchHref(filter),
        filter,
      }
    }

    if (item.type === 'link') {
      const url = (item.url || '').trim()
      if (!url) return null
      return { ...base, url, href: url }
    }

    return null
  }

  function buildSectionTree(
    menuId: string,
    parentId: string | null,
    pathParts: string[]
  ): PublicMegaMenuSection[] {
    const siblings = sortByOrder(
      (sectionsByMenu.get(menuId) || []).filter((s) => (s.parentId || null) === parentId)
    )

    return siblings
      .map((section) => {
        const sectionSlug = slugOrId(section.slug, section.id)
        const nextParts = [...pathParts, sectionSlug]
        const mappedItems = sortByOrder(itemsBySection.get(section.id) || [])
          .map((item) => mapItem(item, nextParts))
          .filter(Boolean) as PublicMegaMenuItem[]

        const childSections = buildSectionTree(menuId, section.id, nextParts)
        const cat = section.categoryId ? categoryRef(categoryById.get(section.categoryId)) : undefined

        // Prefer catalog search URL when a category is linked; else first child/item target.
        let href = cat ? toSearchCategoryPath(cat.id) : ''
        if (!href) {
          const childHref =
            childSections.find((c) => c.href)?.href
            || mappedItems.find((i) => i.href)?.href
            || mappedItems.find((i) => i.url)?.url
          href = childHref || joinCategoryPath(nextParts)
        }

        return {
          id: section.id,
          title: section.title,
          slug: section.slug ?? null,
          sortOrder: Number(section.sortOrder) || 0,
          href,
          ...(cat ? { category: cat } : {}),
          items: mappedItems,
          sections: childSections,
        } satisfies PublicMegaMenuSection
      })
      .filter((s) => s.items.length > 0 || s.sections.length > 0 || Boolean(s.category))
  }

  const menuSlugs = menus.map((m) => slugOrId(m.slug, m.id))
  const taxonomyBySlug = new Map<string, Category>()
  if (menuSlugs.length) {
    const taxonomyRows = await Category.query().whereIn('id', menuSlugs).where('status', 'active')
    for (const row of taxonomyRows) taxonomyBySlug.set(row.id, row)
  }

  const itemsOut: PublicMegaMenu[] = sortByOrder(menus).map((menu) => {
    const menuSlug = slugOrId(menu.slug, menu.id)
    const sections = buildSectionTree(menu.id, null, [menuSlug])
    const firstSectionHref = sections[0]?.href
    const taxonomyLanding = taxonomyBySlug.has(menuSlug)
      ? toSearchCategoryPath(menuSlug)
      : undefined
    const href = firstSectionHref || taxonomyLanding

    return {
      id: menu.id,
      title: menu.title,
      slug: menu.slug,
      icon: menu.icon ?? null,
      sortOrder: Number(menu.sortOrder) || 0,
      ...(href ? { href } : {}),
      sections,
    }
  })

  return { items: itemsOut }
}

function decodePathSegments(path: string): string[] {
  return String(path || '')
    .replace(/^\/+/, '')
    .replace(/^category\//i, '')
    .split('/')
    .map((s) => {
      try {
        return decodeURIComponent(s).trim()
      } catch {
        return s.trim()
      }
    })
    .filter(Boolean)
}

/**
 * Resolve `/category/{menu}/{section}/…/{item}` path segments to a catalog filter.
 */
export async function resolveMegaMenuPath(path: string): Promise<MegaMenuResolveResult | null> {
  const segments = decodePathSegments(path)
  if (!segments.length) return null

  const tree = await loadPublicMegaMenuTree()
  const menu =
    tree.items.find((m) => m.slug === segments[0] || m.id === segments[0]) || null
  if (!menu) return null

  const href = joinCategoryPath(segments)

  if (segments.length === 1) {
    // Never treat menu.slug as a product category unless a section/item actually links one.
    const cat = firstCategoryId(menu.sections)
    return {
      path: segments.join('/'),
      title: menu.title,
      type: 'menu',
      category: cat,
      filter: cat ? { category: cat } : null,
      href: cat ? toSearchCategoryPath(cat) : href,
    }
  }

  let sections = menu.sections
  let currentSection: PublicMegaMenuSection | null = null

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]!
    const isLast = i === segments.length - 1

    const childSection =
      sections.find((s) => (s.slug || s.id) === seg) || null

    if (childSection) {
      currentSection = childSection
      sections = childSection.sections
      if (isLast) {
        const category = childSection.category?.id || null
        return {
          path: segments.join('/'),
          title: childSection.title,
          type: 'section',
          category,
          filter: category ? { category } : null,
          href: category ? toSearchCategoryPath(category) : href,
        }
      }
      continue
    }

    if (isLast && currentSection) {
      const item =
        currentSection.items.find((it) => (it.slug || it.id) === seg) ||
        findItemInTree(currentSection, seg)
      if (!item) return null

      if (item.type === 'link') {
        return {
          path: segments.join('/'),
          title: item.title,
          type: 'item',
          category: null,
          filter: null,
          href: item.url || href,
        }
      }

      if (item.type === 'category' && item.category?.id) {
        return {
          path: segments.join('/'),
          title: item.title,
          type: 'item',
          category: item.category.id,
          filter: { category: item.category.id },
          href: toSearchCategoryPath(item.category.id),
        }
      }

      if (item.type === 'filter' && item.filter) {
        return {
          path: segments.join('/'),
          title: item.title,
          type: 'item',
          category: item.filter.category || null,
          filter: item.filter,
          href: buildSearchHref(item.filter),
        }
      }
    }

    return null
  }

  return null
}

function findItemInTree(
  section: PublicMegaMenuSection,
  slug: string
): PublicMegaMenuItem | null {
  const direct = section.items.find((it) => (it.slug || it.id) === slug)
  if (direct) return direct
  for (const child of section.sections) {
    const found = findItemInTree(child, slug)
    if (found) return found
  }
  return null
}

export async function loadAdminMegaMenuTree(menuId: string) {
  const menu = await MegaMenu.find(menuId)
  if (!menu) return null

  const sections = await MegaMenuSection.query()
    .where('menu_id', menuId)
    .orderBy('sort_order', 'asc')
    .orderBy('title', 'asc')

  const sectionIds = sections.map((s) => s.id)
  const items = sectionIds.length
    ? await MegaMenuItem.query()
        .whereIn('section_id', sectionIds)
        .orderBy('sort_order', 'asc')
        .orderBy('title', 'asc')
    : []

  const categoryIds = new Set<string>()
  for (const s of sections) if (s.categoryId) categoryIds.add(s.categoryId)
  for (const item of items) if (item.categoryId) categoryIds.add(item.categoryId)

  const categories = categoryIds.size
    ? await Category.query().whereIn('id', [...categoryIds])
    : []
  const categoryById = new Map(
    categories.map((c) => [
      c.id,
      { id: c.id, name: c.name, icon: c.icon },
    ])
  )

  const itemsBySection = new Map<string, ReturnType<MegaMenuItem['toAdminJSON']>[]>()
  for (const item of items) {
    const list = itemsBySection.get(item.sectionId) || []
    list.push(
      item.toAdminJSON({
        category: item.categoryId ? categoryById.get(item.categoryId) || null : null,
      })
    )
    itemsBySection.set(item.sectionId, list)
  }

  function build(parentId: string | null): Array<
    ReturnType<MegaMenuSection['toAdminJSON']> & {
      items: ReturnType<MegaMenuItem['toAdminJSON']>[]
      sections: ReturnType<typeof build>
    }
  > {
    return sortByOrder(sections.filter((s) => (s.parentId || null) === parentId)).map((section) => {
      const children = sections.filter((s) => s.parentId === section.id)
      const sectionItems = itemsBySection.get(section.id) || []
      return {
        ...section.toAdminJSON({
          category: section.categoryId ? categoryById.get(section.categoryId) || null : null,
          itemCount: sectionItems.length,
          childCount: children.length,
        }),
        items: sectionItems,
        sections: build(section.id),
      }
    })
  }

  return {
    ...menu.toAdminJSON({ sectionCount: sections.filter((s) => !s.parentId).length }),
    sections: build(null),
  }
}
