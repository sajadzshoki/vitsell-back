import Category from '#models/category'
import technolifeConfig from '#config/technolife'
import { normalizePersianText } from '#services/technolife/persian'
import { extractProductLine, slugifyTaxonomyPart } from '#services/technolife/series'

type RootRule = {
  match: RegExp
  id: string
  name: string
  icon: string
}

const ROOT_RULES: RootRule[] = [
  { match: /گوشی|موبایل|موبايل|mobile|phone/i, id: 'mobile', name: 'موبایل', icon: 'mobile' },
  { match: /تبلت|tablet|ipad/i, id: 'tablet', name: 'تبلت', icon: 'device-tablet' },
  { match: /لپ\s*تاپ|laptop|notebook|macbook/i, id: 'laptop', name: 'لپ‌تاپ', icon: 'device-laptop' },
  { match: /ساعت|watch/i, id: 'wearable', name: 'ساعت هوشمند', icon: 'device-watch' },
  { match: /هدفون|هدفونی|ایرپاد|headphone|earbud|earbuds|airpods/i, id: 'audio', name: 'صوتی و هدفون', icon: 'headphones' },
]

export type ResolvedCategory = {
  id: string
  label: string
  mappedFrom: string | null
  rootId: string
  brandCategoryId: string | null
  /** Coarse line for tags only — never a category id */
  productLine: string | null
  created: string[]
}

async function ensureCategory(input: {
  id: string
  name: string
  icon: string
  parentId: string | null
  createIfMissing: boolean
}): Promise<{ category: Category; created: boolean }> {
  const existing = await Category.find(input.id)
  if (existing) {
    if (input.parentId && !existing.parentId) {
      existing.parentId = input.parentId
      await existing.save()
    }
    return { category: existing, created: false }
  }

  let byNameQuery = Category.query().where('name', input.name)
  byNameQuery = input.parentId
    ? byNameQuery.where('parent_id', input.parentId)
    : byNameQuery.whereNull('parent_id')
  const byName = await byNameQuery.first()
  if (byName) return { category: byName, created: false }

  if (!input.createIfMissing) {
    throw new Error(`دسته «${input.name}» یافت نشد`)
  }

  const created = await Category.create({
    id: input.id,
    name: input.name,
    icon: input.icon,
    image: null,
    text: null,
    parentId: input.parentId,
    status: 'active',
    sortOrder: 0,
    seo: null,
    subs: [],
    pageMeta: null,
    suggested: null,
  })
  return { category: created, created: true }
}

async function appendSubItem(parent: Category, groupName: string, itemName: string) {
  const subs = Array.isArray(parent.subs) ? [...parent.subs] : []
  let group = subs.find((g) => normalizePersianText(g.name) === normalizePersianText(groupName))
  if (!group) {
    group = { name: groupName, items: [] }
    subs.push(group)
  }
  const items = Array.isArray(group.items) ? [...group.items] : []
  if (!items.some((i) => normalizePersianText(i) === normalizePersianText(itemName))) {
    items.push(itemName)
    group.items = items
    parent.subs = subs.map((g) =>
      normalizePersianText(g.name) === normalizePersianText(groupName) ? { ...group!, items } : g
    )
    await parent.save()
  }
}

function pickRoot(hints: string[], fallbackId: string): RootRule {
  const haystack = hints.map((h) => normalizePersianText(h)).join(' | ')
  for (const rule of ROOT_RULES) {
    if (rule.match.test(haystack)) return rule
  }
  return (
    ROOT_RULES.find((r) => r.id === fallbackId) || {
      match: /.*/,
      id: fallbackId || 'mobile',
      name: 'موبایل',
      icon: 'mobile',
    }
  )
}

/**
 * Taxonomy stops at brand (general categories only):
 * موبایل → شیائومی
 * Model/SKU lines become tags via `productLine`, not categories.
 */
export async function resolveCategory(
  hints: string[],
  opts?: {
    fallbackId?: string
    brandName?: string
    model?: string | null
    title?: string
    createIfMissing?: boolean
  }
): Promise<ResolvedCategory> {
  const createIfMissing = opts?.createIfMissing !== false
  const fallbackId = opts?.fallbackId || technolifeConfig.defaultCategoryId
  const rootRule = pickRoot(hints, fallbackId)
  const created: string[] = []
  const mappedFrom = hints.map((h) => normalizePersianText(h)).filter(Boolean).join(' | ') || null

  const root = await ensureCategory({
    id: rootRule.id,
    name: rootRule.name,
    icon: rootRule.icon,
    parentId: null,
    createIfMissing,
  })
  if (root.created) created.push(root.category.id)

  let leaf = root.category
  let brandCategoryId: string | null = null

  const brandName = normalizePersianText(opts?.brandName || '')
  const productLine =
    brandName && brandName !== 'متفرقه'
      ? extractProductLine({
          brandName,
          model: opts?.model || null,
          title: opts?.title || '',
        })
      : null

  if (brandName && brandName !== 'متفرقه') {
    const brandSlug = slugifyTaxonomyPart(brandName)
    const brandCatId = `${root.category.id}-${brandSlug}`.slice(0, 64)

    if (createIfMissing) {
      const brandCat = await ensureCategory({
        id: brandCatId,
        name: brandName,
        icon: rootRule.icon,
        parentId: root.category.id,
        createIfMissing: true,
      })
      if (brandCat.created) created.push(brandCat.category.id)
      brandCategoryId = brandCat.category.id
      leaf = brandCat.category
      await appendSubItem(root.category, 'برندها', brandName)
      if (productLine) {
        await appendSubItem(brandCat.category, 'سری‌ها', productLine)
      }
    } else {
      const existingBrand =
        (await Category.find(brandCatId)) ||
        (await Category.query()
          .where('name', brandName)
          .where('parent_id', root.category.id)
          .first())
      if (existingBrand) {
        brandCategoryId = existingBrand.id
        leaf = existingBrand
      }
    }
  }

  return {
    id: leaf.id,
    label: leaf.name,
    mappedFrom,
    rootId: root.category.id,
    brandCategoryId,
    productLine,
    created,
  }
}
