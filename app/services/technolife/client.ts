import logger from '@adonisjs/core/services/logger'
import technolifeConfig from '#config/technolife'
import { validateTechnolifeUrl } from '#services/technolife/url'
import type { TechnolifeImportErrorCode } from '#services/technolife/types'

export class TechnolifeFetchError extends Error {
  constructor(
    public code: TechnolifeImportErrorCode,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'TechnolifeFetchError'
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

/**
 * Safe Technolife HTML fetcher.
 * No stealth/evasion — realistic browser-like Accept headers only.
 */
export default class TechnolifeClient {
  private lastRequestAt = 0

  async fetchHtml(inputUrl: string): Promise<{ url: string; html: string; sourceProductId: string }> {
    if (!technolifeConfig.enabled) {
      throw new TechnolifeFetchError('DISABLED', 'ایمپورت تکنولایف غیرفعال است')
    }

    const validated = validateTechnolifeUrl(inputUrl)
    if (!validated.ok) {
      throw new TechnolifeFetchError(validated.code, validated.message)
    }

    await this.pace()

    const maxRetries = technolifeConfig.maxRetries
    let attempt = 0
    let lastError: Error | null = null

    while (attempt <= maxRetries) {
      attempt += 1
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), technolifeConfig.timeoutMs)

      try {
        logger.info({ url: validated.normalized, attempt }, '[TechnolifeImporter] Fetching URL')
        const res = await fetch(validated.normalized, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
            'User-Agent':
              'VitsellTechnolifeImporter/1.0 (+internal catalog sync; respectful crawler)',
          },
        })

        if (!res.ok) {
          if (isRetryableStatus(res.status) && attempt <= maxRetries) {
            const backoff = Math.min(8000, 500 * 2 ** (attempt - 1))
            await sleep(backoff)
            continue
          }
          throw new TechnolifeFetchError(
            'NETWORK_ERROR',
            `پاسخ ناموفق از تکنولایف: HTTP ${res.status}`,
            res.status
          )
        }

        const html = await res.text()
        if (!html || html.length < 200) {
          throw new TechnolifeFetchError('PARSE_ERROR', 'محتوای صفحه خالی یا ناقص است')
        }

        return {
          url: validated.normalized,
          html,
          sourceProductId: validated.sourceProductId!,
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (err instanceof TechnolifeFetchError) {
          if (err.code === 'NETWORK_ERROR' && attempt <= maxRetries) {
            const backoff = Math.min(8000, 500 * 2 ** (attempt - 1))
            await sleep(backoff)
            continue
          }
          throw err
        }
        if (attempt <= maxRetries) {
          const backoff = Math.min(8000, 500 * 2 ** (attempt - 1))
          await sleep(backoff)
          continue
        }
        throw new TechnolifeFetchError(
          'NETWORK_ERROR',
          lastError.message || 'خطای شبکه هنگام دریافت صفحه'
        )
      } finally {
        clearTimeout(timer)
        this.lastRequestAt = Date.now()
      }
    }

    throw new TechnolifeFetchError(
      'NETWORK_ERROR',
      lastError?.message || 'خطای شبکه هنگام دریافت صفحه'
    )
  }

  private async pace() {
    const delay = technolifeConfig.requestDelayMs
    if (delay <= 0) return
    const elapsed = Date.now() - this.lastRequestAt
    if (elapsed < delay) {
      await sleep(delay - elapsed)
    }
  }
}
