import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
// DateTime used for source timestamps and batch lifecycle
import technolifeConfig, {
  type TechnolifeFieldPolicy,
  type TechnolifeImportMode,
} from '#config/technolife'
import TechnolifeClient, { TechnolifeFetchError } from '#services/technolife/client'
import { parseTechnolifeHtml } from '#services/technolife/parser'
import { normalizeTechnolifeProduct } from '#services/technolife/normalizer'
import { resolveBrand } from '#services/technolife/brand_mapper'
import { resolveCategory } from '#services/technolife/category_mapper'
import { findDuplicateProduct } from '#services/technolife/duplicate'
import { importRemoteImages, rewriteImportedHtmlImages } from '#services/technolife/image_importer'
import { validateTechnolifeUrl } from '#services/technolife/url'
import ListingWriteService from '#services/listing_write_service'
import ProductImportBatch from '#models/product_import_batch'
import ProductImportItem from '#models/product_import_item'
import Product from '#models/product'
import type {
  TechnolifeImportItemResult,
  TechnolifePreviewResult,
} from '#services/technolife/types'

export type ImportOptions = {
  mode: TechnolifeImportMode
  fieldPolicy?: Partial<TechnolifeFieldPolicy>
  downloadImages?: boolean
  listingStatus?: 'active' | 'pending' | 'inactive' | 'out_of_stock'
}

function mergePolicy(partial?: Partial<TechnolifeFieldPolicy>): TechnolifeFieldPolicy {
  return { ...technolifeConfig.defaultFieldPolicy, ...partial }
}

async function uniqueProductId(suggested: string | null): Promise<string | undefined> {
  if (!suggested) return undefined
  let candidate = suggested
  let suffix = 2
  while (await Product.find(candidate)) {
    candidate = `${suggested}-${suffix}`
    suffix += 1
  }
  return candidate
}

export default class TechnolifeImportService {
  private client = new TechnolifeClient()
  private listings = new ListingWriteService()

  async previewUrl(url: string): Promise<TechnolifePreviewResult> {
    return this.runOne(url, { mode: 'preview', downloadImages: false })
  }

  async importUrl(url: string, options: ImportOptions): Promise<TechnolifeImportItemResult> {
    const base = await this.runOne(url, options)
    return base as TechnolifeImportItemResult
  }

  async createBatch(urls: string[], options: ImportOptions) {
    const cleaned = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
    const batch = await ProductImportBatch.create({
      source: 'technolife',
      status: 'pending',
      mode: options.mode,
      config: {
        fieldPolicy: mergePolicy(options.fieldPolicy),
        downloadImages: options.downloadImages !== false,
        listingStatus: options.listingStatus || 'pending',
      },
      totalCount: cleaned.length,
      successCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      startedAt: null,
      finishedAt: null,
    })

    for (const url of cleaned) {
      const validated = validateTechnolifeUrl(url)
      await ProductImportItem.create({
        batchId: batch.id,
        source: 'technolife',
        sourceUrl: validated.ok ? validated.normalized : url,
        sourceProductId: validated.ok ? validated.sourceProductId : null,
        status: 'pending',
        productId: null,
        errorCode: validated.ok ? null : validated.code,
        errorMessage: validated.ok ? null : validated.message,
        warnings: [],
        result: null,
        startedAt: null,
        finishedAt: null,
      })
    }

    return batch
  }

  async processBatch(batchId: number) {
    const batch = await ProductImportBatch.findOrFail(batchId)
    if (batch.status === 'processing') return batch

    batch.status = 'processing'
    batch.startedAt = DateTime.now()
    await batch.save()

    const items = await ProductImportItem.query().where('batch_id', batchId).orderBy('id', 'asc')
    const config = (batch.config || {}) as {
      fieldPolicy?: Partial<TechnolifeFieldPolicy>
      downloadImages?: boolean
      listingStatus?: 'active' | 'pending' | 'inactive' | 'out_of_stock'
    }
    const mode = (batch.mode as TechnolifeImportMode) || 'create_only'

    let success = 0
    let failed = 0
    let duplicate = 0

    for (const item of items) {
      if (item.status === 'success') {
        success += 1
        continue
      }
      item.status = 'processing'
      item.startedAt = DateTime.now()
      await item.save()

      try {
        const result = await this.runOne(item.sourceUrl, {
          mode,
          fieldPolicy: config.fieldPolicy,
          downloadImages: config.downloadImages !== false,
          listingStatus: config.listingStatus,
        })

        item.status = result.status
        item.productId = result.productId
        item.sourceProductId = result.normalized?.sourceProductId || item.sourceProductId
        item.errorCode = result.error?.code || null
        item.errorMessage = result.error?.message || null
        item.warnings = result.warnings
        item.result = result
        item.finishedAt = DateTime.now()
        await item.save()

        if (result.status === 'success' || result.status === 'partial') success += 1
        else if (result.status === 'duplicate') duplicate += 1
        else failed += 1
      } catch (err) {
        item.status = 'failed'
        item.errorCode = 'DATABASE_ERROR'
        item.errorMessage = err instanceof Error ? err.message : String(err)
        item.finishedAt = DateTime.now()
        await item.save()
        failed += 1
      }
    }

    batch.successCount = success
    batch.failedCount = failed
    batch.duplicateCount = duplicate
    batch.status = failed === 0 && duplicate === 0 ? 'success' : success > 0 ? 'partial' : 'failed'
    batch.finishedAt = DateTime.now()
    await batch.save()
    logger.info({ batchId }, '[TechnolifeImporter] Import completed')
    return batch
  }

  async retryBatch(batchId: number) {
    const items = await ProductImportItem.query()
      .where('batch_id', batchId)
      .whereIn('status', ['failed', 'pending'])
    for (const item of items) {
      item.status = 'pending'
      item.errorCode = null
      item.errorMessage = null
      await item.save()
    }
    const batch = await ProductImportBatch.findOrFail(batchId)
    batch.status = 'pending'
    batch.finishedAt = null
    await batch.save()
    return this.processBatch(batchId)
  }

  private async runOne(url: string, options: ImportOptions): Promise<TechnolifeImportItemResult> {
    const warnings: string[] = []
    const empty: TechnolifeImportItemResult = {
      url,
      parsed: null,
      normalized: null,
      brand: null,
      category: null,
      duplicate: null,
      warnings,
      error: null,
      status: 'failed',
      productId: null,
      imagesImported: [],
      fieldsChanged: [],
    }

    const validated = validateTechnolifeUrl(url)
    if (!validated.ok) {
      return {
        ...empty,
        error: { code: validated.code, message: validated.message },
        status: 'failed',
      }
    }

    try {
      const fetched = await this.client.fetchHtml(validated.normalized)
      const parsed = parseTechnolifeHtml(fetched.html, fetched.url)
      if (!parsed.name) {
        return {
          ...empty,
          parsed,
          error: { code: 'PARSE_ERROR', message: 'نام محصول استخراج نشد' },
          status: 'failed',
        }
      }

      const normalized = normalizeTechnolifeProduct(parsed)
      logger.info(
        { id: normalized.sourceProductId, title: normalized.title },
        '[TechnolifeImporter] Product detected'
      )

      if (!normalized.priceToman || normalized.priceToman < 1) {
        warnings.push('قیمت معتبر یافت نشد')
      }

      const brand = await resolveBrand(normalized.brandName, {
        createIfMissing: options.mode !== 'preview',
      })
      logger.info({ brand: brand.name }, '[TechnolifeImporter] Brand resolved')

      const category = await resolveCategory(normalized.categoryHints)
      const duplicate = await findDuplicateProduct(normalized)
      logger.info({ duplicate }, '[TechnolifeImporter] Duplicate check')

      const preview: TechnolifeImportItemResult = {
        url: validated.normalized,
        parsed,
        normalized,
        brand: { id: brand.id || null, name: brand.name, created: brand.created },
        category: { id: category.id, label: category.label },
        duplicate,
        warnings,
        error: null,
        status: 'success',
        productId: duplicate?.productId || null,
        imagesImported: [],
        fieldsChanged: [],
      }

      if (options.mode === 'preview') {
        return preview
      }

      if (duplicate && options.mode === 'create_only') {
        return {
          ...preview,
          status: 'duplicate',
          error: {
            code: 'DUPLICATE',
            message: `محصول تکراری (${duplicate.reason}): ${duplicate.productId}`,
          },
        }
      }

      if (!normalized.priceToman || normalized.priceToman < 1) {
        return {
          ...preview,
          status: 'failed',
          error: { code: 'VALIDATION_ERROR', message: 'قیمت برای ایجاد محصول الزامی است' },
        }
      }

      const policy = mergePolicy(options.fieldPolicy)
      let imageUrls = normalized.images
      const imagesImported: string[] = []
      let description = normalized.description

      if (options.downloadImages !== false && normalized.images.length) {
        const limited = normalized.images.slice(0, technolifeConfig.maxImages)
        const imported = await importRemoteImages(limited, validated.normalized, {
          alt: normalized.title,
        })
        warnings.push(...imported.warnings)
        if (imported.urls.length) {
          imageUrls = imported.urls
          imagesImported.push(...imported.urls)
        } else {
          warnings.push('هیچ تصویری دانلود نشد؛ از URL خارجی استفاده می‌شود')
        }
      }

      if (options.downloadImages !== false && normalized.reviewImages.length) {
        const reviewMedia = await importRemoteImages(
          normalized.reviewImages.slice(0, technolifeConfig.maxImages),
          validated.normalized,
          { alt: normalized.shortName || normalized.title }
        )
        warnings.push(...reviewMedia.warnings)
        imagesImported.push(...reviewMedia.urls)
        description = rewriteImportedHtmlImages(
          description,
          validated.normalized,
          reviewMedia.items,
          true
        )
        if (reviewMedia.urls.length < normalized.reviewImages.length) {
          warnings.push('برخی تصاویر نقد و بررسی دانلود نشدند و از توضیحات حذف شدند')
        }
      }

      const primaryImage = imageUrls[0] || '/images/placeholder-product.png'
      const gallery = imageUrls.slice(1)
      const fieldsChanged: string[] = []

      if (duplicate && options.mode === 'upsert') {
        const patch: Record<string, unknown> = {
          brand: brand.name,
          category: category.id,
          categoryLabel: category.label,
          source: 'technolife',
          sourceUrl: normalized.sourceUrl,
          sourceProductId: normalized.sourceProductId,
          sourceUpdatedAt: DateTime.now(),
          tags: [],
        }
        fieldsChanged.push('source')

        if (policy.updateDescription) {
          patch.title = normalized.title
          patch.shortName = normalized.shortName
          patch.shortDesc = normalized.shortDesc
          patch.description = description
          fieldsChanged.push('description')
        }
        if (policy.updatePrice) {
          patch.price = normalized.priceToman
          patch.oldPrice = normalized.oldPriceToman
          fieldsChanged.push('price')
        }
        if (policy.updateImages && imageUrls.length) {
          patch.image = primaryImage
          patch.gallery = gallery
          patch.colors = normalized.colors
          fieldsChanged.push('images')
        }
        if (policy.updateSpecs && normalized.specs.length) {
          patch.specs = normalized.specs
          fieldsChanged.push('specs')
        }

        const stock = policy.updateInventory ? normalized.stock : undefined

        const updated = await this.listings.updateListing(duplicate.productId, {
          product: patch as never,
          ...(stock !== undefined ? { stock } : {}),
        })

        return {
          ...preview,
          status: warnings.some((w) => w.includes('تصویر')) ? 'partial' : 'success',
          productId: updated.product.id,
          imagesImported,
          fieldsChanged,
          warnings,
        }
      }

      // create
      logger.info({ title: normalized.title }, '[TechnolifeImporter] Creating product')
      const productId = await uniqueProductId(normalized.suggestedProductId)
      const created = await this.listings.createListing({
        product: {
          id: productId,
          title: normalized.title,
          shortName: normalized.shortName,
          brand: brand.name,
          category: category.id,
          categoryLabel: category.label,
          price: normalized.priceToman,
          oldPrice: normalized.oldPriceToman,
          image: primaryImage,
          gallery: gallery.length ? gallery : null,
          colors: normalized.colors.length
            ? normalized.colors.map(({ name, hex }) => ({ name, hex }))
            : null,
          shortDesc: normalized.shortDesc,
          description,
          specs: normalized.specs,
          sku: normalized.sku,
          inStock: normalized.stock > 0,
          published: true,
          tags: [],
          source: 'technolife',
          sourceUrl: normalized.sourceUrl,
          sourceProductId: normalized.sourceProductId,
          sourceImportedAt: DateTime.now(),
          sourceUpdatedAt: DateTime.now(),
        },
        stock: normalized.stock,
        status: options.listingStatus || 'pending',
      })

      return {
        ...preview,
        status: imagesImported.length || !normalized.images.length ? 'success' : 'partial',
        productId: created.product.id,
        imagesImported,
        fieldsChanged: ['created'],
        warnings,
        duplicate: null,
      }
    } catch (err) {
      if (err instanceof TechnolifeFetchError) {
        return {
          ...empty,
          error: { code: err.code, message: err.message },
          status: 'failed',
        }
      }
      logger.error({ err }, '[TechnolifeImporter] Import failed')
      return {
        ...empty,
        error: {
          code: 'DATABASE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
        status: 'failed',
      }
    }
  }
}
