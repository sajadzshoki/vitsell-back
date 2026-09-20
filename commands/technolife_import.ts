import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { readFile } from 'node:fs/promises'
import technolifeConfig from '#config/technolife'
import TechnolifeImportService from '#services/technolife/import_service'
import TechnolifeCategoryDiscoverer from '#services/technolife/category_discover'
import { validateTechnolifeInputUrl } from '#services/technolife/url'

export default class TechnolifeImport extends BaseCommand {
  static commandName = 'technolife:import'
  static description =
    'Import Technolife product/category URL(s). Numeric arg = limit from default category.'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Product URL, category URL, or numeric limit (e.g. 20)',
    required: false,
  })
  declare target: string | undefined

  @flags.string({ description: 'Path to a text file with one URL per line', alias: 'f' })
  declare file: string | undefined

  @flags.string({ description: 'Technolife category URL to discover products from', alias: 'c' })
  declare category: string | undefined

  @flags.number({ description: 'Max products to import from a category', alias: 'l' })
  declare limit: number | undefined

  @flags.boolean({ description: 'Parse only; do not write catalog', alias: 'd' })
  declare dryRun: boolean

  @flags.string({ description: 'create_only | upsert (default create_only)' })
  declare mode: string | undefined

  @flags.boolean({ description: 'Skip image downloads', alias: 'S' })
  declare skipImages: boolean

  @flags.boolean({
    description: 'In upsert mode update price, inventory, description, images, and specs',
    alias: 'A',
  })
  declare updateAll: boolean

  async run() {
    const urls = await this.resolveProductUrls()
    if (!urls.length) {
      this.logger.error(
        'Provide a product URL, category URL, numeric limit (e.g. 20), --category, and/or --file=urls.txt'
      )
      this.exitCode = 1
      return
    }

    const service = new TechnolifeImportService()
    const mode = this.dryRun ? 'preview' : this.mode === 'upsert' ? 'upsert' : 'create_only'
    const fieldPolicy = this.updateAll
      ? {
          updatePrice: true,
          updateInventory: true,
          updateDescription: true,
          updateImages: true,
          updateSpecs: true,
        }
      : undefined

    if (this.dryRun || urls.length === 1) {
      for (const url of urls) {
        const result = await service.importUrl(url, {
          mode,
          downloadImages: !this.skipImages && !this.dryRun,
          fieldPolicy,
        })
        this.logger.info(JSON.stringify(result, null, 2))
      }
      return
    }

    const batch = await service.createBatch(urls, {
      mode: mode === 'preview' ? 'create_only' : mode,
      downloadImages: !this.skipImages,
      fieldPolicy,
    })
    this.logger.info(`Batch #${batch.id} created (${urls.length} URLs). Processing…`)
    const done = await service.processBatch(batch.id)
    this.logger.success(
      `Done: status=${done.status} success=${done.successCount} duplicate=${done.duplicateCount} failed=${done.failedCount}`
    )
  }

  private async resolveProductUrls(): Promise<string[]> {
    const urls: string[] = []
    let categoryUrl: string | undefined
    let limit = this.limit

    const target = this.target?.trim()
    if (target) {
      if (/^\d+$/.test(target)) {
        limit = Number(target)
        categoryUrl = this.category || technolifeConfig.defaultCategoryUrl
      } else {
        const validated = validateTechnolifeInputUrl(target)
        if (!validated.ok) {
          this.logger.error(validated.message)
          this.exitCode = 1
          return []
        }
        if (validated.kind === 'category') {
          categoryUrl = validated.normalized
        } else {
          urls.push(validated.normalized)
        }
      }
    }

    if (this.category) {
      categoryUrl = this.category
    }

    if (this.file) {
      const text = await readFile(this.file, 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const u = line.trim()
        if (!u || u.startsWith('#')) continue
        const validated = validateTechnolifeInputUrl(u)
        if (!validated.ok) {
          this.logger.warning(`Skip invalid URL: ${u} (${validated.message})`)
          continue
        }
        if (validated.kind === 'category') {
          categoryUrl = validated.normalized
        } else {
          urls.push(validated.normalized)
        }
      }
    }

    if (categoryUrl) {
      const requested = Math.max(1, Math.floor(limit || 20))
      const hardCap = technolifeConfig.maxCategoryImport
      if (requested > hardCap) {
        this.logger.warning(
          `Requested ${requested} products but TECHNOLIFE_MAX_CATEGORY_IMPORT=${hardCap}; capping discovery`
        )
      }
      const max = Math.min(requested, hardCap)
      this.logger.info(`Discovering up to ${max} products from category…`)
      const discoverer = new TechnolifeCategoryDiscoverer()
      const discovered = await discoverer.discover(categoryUrl, max)
      for (const warning of discovered.warnings) this.logger.warning(warning)
      this.logger.info(
        `Category ${discovered.listingPath}: selected ${discovered.productUrls.length}/${discovered.totalCount}`
      )
      urls.push(...discovered.productUrls)
    }

    return [...new Set(urls)]
  }
}
