import Category from '#models/category'
import technolifeConfig from '#config/technolife'
import { normalizePersianText } from '#services/technolife/persian'

/** Configurable Technolife breadcrumb / path → Vitsell category id */
const CATEGORY_MAP: Array<{ match: RegExp; categoryId: string }> = [
  { match: /گوشی|موبایل|mobile|phone/i, categoryId: 'mobile' },
  { match: /تبلت|tablet/i, categoryId: 'tablet' },
  { match: /لپ\s*تاپ|laptop|notebook/i, categoryId: 'laptop' },
  { match: /ساعت|watch/i, categoryId: 'wearable' },
  { match: /هدفون|هدفونی|headphone|earbud|earbuds/i, categoryId: 'audio' },
]

export type ResolvedCategory = {
  id: string
  label: string
  mappedFrom: string | null
}

export async function resolveCategory(
  hints: string[],
  opts?: { fallbackId?: string }
): Promise<ResolvedCategory> {
  const fallbackId = opts?.fallbackId || technolifeConfig.defaultCategoryId
  const haystack = hints.map((h) => normalizePersianText(h)).join(' | ')

  let mappedId = fallbackId
  let mappedFrom: string | null = null
  for (const rule of CATEGORY_MAP) {
    if (rule.match.test(haystack)) {
      mappedId = rule.categoryId
      mappedFrom = haystack
      break
    }
  }

  let cat = await Category.find(mappedId)
  if (!cat && mappedId !== fallbackId) {
    cat = await Category.find(fallbackId)
    mappedId = fallbackId
  }
  if (!cat) {
    // Last resort: first active category
    cat = await Category.query().where('status', 'active').orderBy('id', 'asc').first()
  }
  if (!cat) {
    throw new Error('هیچ دسته‌بندی فعالی در ویتسل یافت نشد')
  }

  return {
    id: cat.id,
    label: cat.name,
    mappedFrom,
  }
}
