import logger from '@adonisjs/core/services/logger'
import technolifeConfig from '#config/technolife'
import TechnolifeClient, { TechnolifeFetchError } from '#services/technolife/client'
import {
  buildTechnolifeProductUrl,
  extractTechnolifeCategoryPath,
  validateTechnolifeCategoryUrl,
} from '#services/technolife/url'

export type TechnolifeCategoryFilterObj = {
  page_type: 'dynamic'
  limit: number
  skip?: number
  brand_filters?: number[]
  attribute_filters?: number[]
  available?: boolean
}

export type CategoryDiscoverResult = {
  categoryUrl: string
  listingPath: string
  productUrls: string[]
  totalCount: number
  warnings: string[]
}

const MENU_PRODUCTS_QUERY = `query get_menu_products($url: String, $filterObj: filter_obj) {
  get_menu_products(url: $url, filterObj: $filterObj) {
    results { code name }
    count
  }
}`

const PAGE_SIZE = 30

function parseIntList(raw: string | null): number[] {
  if (!raw) return []
  const values = raw
    .split(/[,|]/)
    .map((part) => Number(String(part).trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.floor(n))
  return [...new Set(values)]
}

function truthyQuery(raw: string | null): boolean {
  if (!raw) return false
  const s = raw.trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

export function buildCategoryFilterObj(
  categoryUrl: URL,
  limit: number,
  skip?: number
): TechnolifeCategoryFilterObj {
  const filterObj: TechnolifeCategoryFilterObj = {
    page_type: 'dynamic',
    limit: Math.max(1, Math.min(PAGE_SIZE, Math.floor(limit))),
  }

  if (skip !== undefined && skip >= 0) {
    filterObj.skip = Math.floor(skip)
  }

  const brandFilters = [
    ...parseIntList(categoryUrl.searchParams.get('manufacturer_id')),
    ...parseIntList(categoryUrl.searchParams.get('brand_filters')),
  ]
  if (brandFilters.length) filterObj.brand_filters = [...new Set(brandFilters)]

  const attributeFilters = [
    ...parseIntList(categoryUrl.searchParams.get('af')),
    ...parseIntList(categoryUrl.searchParams.get('attribute_filters')),
  ]
  if (attributeFilters.length) filterObj.attribute_filters = [...new Set(attributeFilters)]

  if (
    truthyQuery(categoryUrl.searchParams.get('only_available')) ||
    truthyQuery(categoryUrl.searchParams.get('available'))
  ) {
    filterObj.available = true
  }

  return filterObj
}

function productIdFromCode(code: unknown): string | null {
  const raw = String(code || '').trim()
  const match = raw.match(/^TLP-(\d+)$/i) || raw.match(/^(\d+)$/)
  return match?.[1] || null
}

type MenuProductsPage = {
  results: Array<{ code?: string; name?: string }>
  count: number
}

export default class TechnolifeCategoryDiscoverer {
  constructor(private client = new TechnolifeClient()) {}

  async discover(categoryUrlInput: string, limit: number): Promise<CategoryDiscoverResult> {
    if (!technolifeConfig.enabled) {
      throw new TechnolifeFetchError('DISABLED', 'ایمپورت تکنولایف غیرفعال است')
    }

    const validated = validateTechnolifeCategoryUrl(categoryUrlInput)
    if (!validated.ok) {
      throw new TechnolifeFetchError(validated.code, validated.message)
    }

    const listingPath = extractTechnolifeCategoryPath(validated.url.pathname)
    if (!listingPath) {
      throw new TechnolifeFetchError('VALIDATION_ERROR', 'مسیر دسته نامعتبر است')
    }

    const maxLimit = Math.max(1, Math.min(technolifeConfig.maxCategoryImport, Math.floor(limit)))
    const warnings: string[] = []
    const productUrls: string[] = []
    const seen = new Set<string>()
    let totalCount = 0
    let pageIndex = 0

    while (productUrls.length < maxLimit) {
      const remaining = maxLimit - productUrls.length
      // Technolife `skip` is a 0-based page index (not an item offset).
      const filterObj = buildCategoryFilterObj(validated.url, remaining, pageIndex)
      const page = await this.fetchMenuPage(validated.url.origin, listingPath, filterObj)
      totalCount = page.count || totalCount

      if (!page.results.length) break

      let added = 0
      for (const row of page.results) {
        const productId = productIdFromCode(row.code)
        if (!productId || seen.has(productId)) continue
        seen.add(productId)
        productUrls.push(buildTechnolifeProductUrl(validated.url.origin, productId))
        added += 1
        if (productUrls.length >= maxLimit) break
      }

      if (page.results.length < filterObj.limit) break
      if (added === 0) {
        warnings.push('pagination stalled (no new products); stopping')
        break
      }
      pageIndex += 1
      if (pageIndex > 500) {
        warnings.push('pagination aborted after safety cap')
        break
      }
    }

    if (!productUrls.length) {
      warnings.push('هیچ محصولی در این دسته پیدا نشد')
    } else if (totalCount > productUrls.length) {
      warnings.push(`فقط ${productUrls.length} از ${totalCount} محصول دسته انتخاب شد`)
    }

    logger.info(
      {
        categoryUrl: validated.normalized,
        discovered: productUrls.length,
        totalCount,
        limit: maxLimit,
      },
      '[TechnolifeImporter] Category products discovered'
    )

    return {
      categoryUrl: validated.normalized,
      listingPath,
      productUrls,
      totalCount,
      warnings,
    }
  }

  private async fetchMenuPage(
    origin: string,
    listingPath: string,
    filterObj: TechnolifeCategoryFilterObj
  ): Promise<MenuProductsPage> {
    const endpoint = `${origin.replace(/\/+$/, '')}/shop_plp`
    const payload = {
      operationName: 'get_menu_products',
      variables: {
        url: listingPath,
        filterObj,
      },
      query: MENU_PRODUCTS_QUERY,
    }

    const json = await this.client.fetchJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: origin,
        Referer: `${origin}/${listingPath}`,
      },
    })

    const data = (json as { data?: { get_menu_products?: MenuProductsPage } })?.data
      ?.get_menu_products
    if (!data || !Array.isArray(data.results)) {
      throw new TechnolifeFetchError('PARSE_ERROR', 'پاسخ لیست محصولات دسته نامعتبر است')
    }

    return {
      results: data.results,
      count: Number(data.count) || 0,
    }
  }
}
