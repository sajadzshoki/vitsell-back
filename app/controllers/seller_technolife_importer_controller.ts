import vine from '@vinejs/vine'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import TechnolifeImportService from '#services/technolife/import_service'
import ProductImportBatch from '#models/product_import_batch'
import ProductImportItem from '#models/product_import_item'
import technolifeConfig from '#config/technolife'

const fieldPolicySchema = vine.object({
  updatePrice: vine.boolean().optional(),
  updateInventory: vine.boolean().optional(),
  updateDescription: vine.boolean().optional(),
  updateImages: vine.boolean().optional(),
  updateSpecs: vine.boolean().optional(),
})

const previewValidator = vine.compile(
  vine.object({
    urls: vine.array(vine.string().trim()).minLength(1).maxLength(20),
  })
)

const importValidator = vine.compile(
  vine.object({
    urls: vine.array(vine.string().trim()).minLength(1).maxLength(50),
    mode: vine.enum(['create_only', 'upsert'] as const).optional(),
    downloadImages: vine.boolean().optional(),
    listingStatus: vine.enum(['active', 'pending', 'inactive', 'out_of_stock'] as const).optional(),
    fieldPolicy: fieldPolicySchema.clone().optional(),
  })
)

export default class SellerTechnolifeImporterController {
  private service = new TechnolifeImportService()

  async preview({ request, response }: HttpContext) {
    if (!technolifeConfig.enabled) {
      return response.serviceUnavailable({
        errors: [{ field: 'technolife', message: 'ایمپورت تکنولایف غیرفعال است' }],
      })
    }
    const payload = await request.validateUsing(previewValidator)
    const results = []
    for (const url of payload.urls) {
      results.push(await this.service.previewUrl(url))
    }
    return response.ok({ results })
  }

  async import({ request, response }: HttpContext) {
    if (!technolifeConfig.enabled) {
      return response.serviceUnavailable({
        errors: [{ field: 'technolife', message: 'ایمپورت تکنولایف غیرفعال است' }],
      })
    }
    const payload = await request.validateUsing(importValidator)
    const batch = await this.service.createBatch(payload.urls, {
      mode: payload.mode || 'create_only',
      downloadImages: payload.downloadImages !== false,
      listingStatus: payload.listingStatus || 'pending',
      fieldPolicy: payload.fieldPolicy,
    })

    // Non-blocking sequential worker (no Redis queue in this stack)
    void this.service.processBatch(batch.id).catch((err) => {
      logger.error({ err, batchId: batch.id }, '[TechnolifeImporter] Batch failed')
    })

    return response.accepted(batch.toAdminJSON())
  }

  async imports({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page') || 1))
    const pageSize = Math.min(50, Math.max(1, Number(request.input('pageSize') || 20)))
    const query = ProductImportBatch.query().where('source', 'technolife').orderBy('id', 'desc')
    const total = await query.clone().count('* as total')
    const count = Number((total[0] as unknown as { $extras: { total: string } })?.$extras?.total || 0)
    const rows = await query.offset((page - 1) * pageSize).limit(pageSize)
    return response.ok({
      items: rows.map((b) => b.toAdminJSON()),
      page,
      pageSize,
      total: count,
    })
  }

  async showImport({ params, response }: HttpContext) {
    const batch = await ProductImportBatch.find(params.id)
    if (!batch) {
      return response.notFound({ errors: [{ field: 'id', message: 'بچ ایمپورت یافت نشد' }] })
    }
    const items = await ProductImportItem.query().where('batch_id', batch.id).orderBy('id', 'asc')
    return response.ok(batch.toAdminJSON(items))
  }

  async retryImport({ params, response }: HttpContext) {
    const batch = await ProductImportBatch.find(params.id)
    if (!batch) {
      return response.notFound({ errors: [{ field: 'id', message: 'بچ ایمپورت یافت نشد' }] })
    }
    void this.service.retryBatch(batch.id).catch((err) => {
      logger.error({ err, batchId: batch.id }, '[TechnolifeImporter] Retry failed')
    })
    return response.accepted({ id: batch.id, status: 'processing' })
  }
}
