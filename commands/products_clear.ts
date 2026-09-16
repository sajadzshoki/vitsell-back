import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import Product from '#models/product'

export default class ProductsClear extends BaseCommand {
  static commandName = 'products:clear'
  static description = 'Delete local catalog products (destructive)'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Required confirmation for destructive deletion', alias: 'f' })
  declare force: boolean

  @flags.boolean({ description: 'Delete only products imported from Technolife', alias: 'T' })
  declare technolifeOnly: boolean

  async run() {
    const nodeEnv = String(env.get('NODE_ENV')).toLowerCase()
    if (nodeEnv === 'production') {
      this.logger.error('Refusing to clear products while NODE_ENV=production')
      this.exitCode = 1
      return
    }

    if (!this.force) {
      this.logger.error('This command is destructive. Re-run with --force.')
      this.exitCode = 1
      return
    }

    if (this.technolifeOnly) {
      const count = await db.transaction(async (trx) => {
        const countRow = await Product.query({ client: trx })
          .where('source', 'technolife')
          .count('* as total')
          .first()
        await Product.query({ client: trx }).where('source', 'technolife').delete()
        return Number(countRow?.$extras.total || 0)
      })
      this.logger.success(`Deleted ${count} Technolife product(s) from ${nodeEnv}`)
      return
    }

    const count = await db.transaction(async (trx) => {
      const countRow = await Product.query({ client: trx }).count('* as total').first()
      await trx.rawQuery('TRUNCATE TABLE products CASCADE')
      return Number(countRow?.$extras.total || 0)
    })
    this.logger.success(`Deleted ${count} product(s) and dependent catalog rows from ${nodeEnv}`)
  }
}
