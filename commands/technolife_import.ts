import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { readFile } from 'node:fs/promises'
import TechnolifeImportService from '#services/technolife/import_service'

export default class TechnolifeImport extends BaseCommand {
  static commandName = 'technolife:import'
  static description = 'Import Technolife product URL(s) into the Vitsell catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Technolife product URL', required: false })
  declare url: string | undefined

  @flags.string({ description: 'Path to a text file with one URL per line', alias: 'f' })
  declare file: string | undefined

  @flags.boolean({ description: 'Parse only; do not write catalog', alias: 'd' })
  declare dryRun: boolean

  @flags.string({ description: 'create_only | upsert (default create_only)' })
  declare mode: string | undefined

  @flags.boolean({ description: 'Skip image downloads', alias: 'S' })
  declare skipImages: boolean

  async run() {
    const urls: string[] = []
    if (this.url) urls.push(this.url)
    if (this.file) {
      const text = await readFile(this.file, 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const u = line.trim()
        if (u && !u.startsWith('#')) urls.push(u)
      }
    }

    if (!urls.length) {
      this.logger.error('Provide a URL argument and/or --file=urls.txt')
      this.exitCode = 1
      return
    }

    const service = new TechnolifeImportService()
    const mode = this.dryRun ? 'preview' : this.mode === 'upsert' ? 'upsert' : 'create_only'

    if (this.dryRun || urls.length === 1) {
      for (const url of urls) {
        const result = await service.importUrl(url, {
          mode,
          downloadImages: !this.skipImages && !this.dryRun,
        })
        this.logger.info(JSON.stringify(result, null, 2))
      }
      return
    }

    const batch = await service.createBatch(urls, {
      mode: mode === 'preview' ? 'create_only' : mode,
      downloadImages: !this.skipImages,
    })
    this.logger.info(`Batch #${batch.id} created (${urls.length} URLs). Processing…`)
    const done = await service.processBatch(batch.id)
    this.logger.success(
      `Done: status=${done.status} success=${done.successCount} duplicate=${done.duplicateCount} failed=${done.failedCount}`
    )
  }
}
