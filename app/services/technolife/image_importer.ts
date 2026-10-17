import { randomBytes } from 'node:crypto'
import { extname } from 'node:path'
import drive from '@adonisjs/drive/services/main'
import logger from '@adonisjs/core/services/logger'
import MediaAsset from '#models/media_asset'
import { kindFromExt, mimeFromExt, MEDIA_IMAGE_EXT } from '#utils/media_upload'
import { validateTechnolifeUrl, normalizeImageUrl } from '#services/technolife/url'
import technolifeConfig from '#config/technolife'
import { stripTechnolifeLogo } from '#services/technolife/logo_strip'
import { resolveTechnolifeLogoStripOptions } from '#services/technolife/logo_strip_runtime'

const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    return extname(path).replace(/^\./, '').toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Download remote images and store via Drive + MediaAsset.
 * Dedupes by source URL stored in usageHints as `source:{url}`.
 */
export async function importRemoteImages(
  imageUrls: string[],
  pageUrl: string,
  opts?: { alt?: string }
): Promise<{
  urls: string[]
  items: Array<{ sourceUrl: string; storedUrl: string }>
  warnings: string[]
}> {
  const warnings: string[] = []
  const imported: string[] = []
  const items: Array<{ sourceUrl: string; storedUrl: string }> = []
  const seen = new Set<string>()

  for (const raw of imageUrls) {
    const abs = normalizeImageUrl(raw, pageUrl)
    if (!abs || seen.has(abs)) continue
    seen.add(abs)

    // Reuse existing media registered for this source URL
    const existing = await MediaAsset.query().where('description', `source:${abs}`).first()
    if (existing) {
      imported.push(existing.url)
      items.push({ sourceUrl: abs, storedUrl: existing.url })
      continue
    }

    try {
      // Image hosts may not be technolife product URL host — still block SSRF
      const hostOk = (() => {
        try {
          const u = new URL(abs)
          const host = u.hostname.toLowerCase()
          if (host === 'localhost' || host.startsWith('127.') || host.startsWith('10.'))
            return false
          if (host.startsWith('192.168.') || host.startsWith('169.254.')) return false
          return u.protocol === 'https:' || u.protocol === 'http:'
        } catch {
          return false
        }
      })()
      if (!hostOk) {
        warnings.push(`تصویر رد شد (SSRF): ${abs}`)
        continue
      }

      if (technolifeConfig.requestDelayMs > 0) {
        await sleep(Math.min(500, technolifeConfig.requestDelayMs))
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), technolifeConfig.timeoutMs)
      let res: Response
      try {
        res = await fetch(abs, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent': 'VitsellTechnolifeImporter/1.0',
            'Referer': pageUrl,
          },
        })
      } finally {
        clearTimeout(timer)
      }

      if (!res.ok) {
        warnings.push(`دانلود تصویر ناموفق (${res.status})`)
        continue
      }

      const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      let ext = IMAGE_MIME_EXT[contentType] || extFromUrl(abs)
      if (ext === 'jpeg') ext = 'jpg'
      if (!MEDIA_IMAGE_EXT.has(ext)) {
        warnings.push(`نوع تصویر نامعتبر: ${contentType || ext}`)
        continue
      }

      let buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 100 || buf.length > 12 * 1024 * 1024) {
        warnings.push('حجم تصویر نامعتبر است')
        continue
      }

      let logoStripped = false
      const logoOpts = resolveTechnolifeLogoStripOptions()
      if (logoOpts.stripLogo) {
        try {
          const stripped = await stripTechnolifeLogo(buf, {
            mimeHint: contentType,
            force: logoOpts.stripLogoForce,
          })
          buf = stripped.buffer
          logoStripped = stripped.stripped
        } catch (err) {
          warnings.push(
            `حذف لوگوی تصویر ناموفق: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      }

      const storedName = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
      const mimeType = mimeFromExt(ext, contentType || 'image/jpeg')
      await drive.use().put(storedName, buf, {
        contentType: mimeType,
        visibility: 'public',
      })

      const url = `/uploads/${storedName}`
      const id = `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      await MediaAsset.create({
        id,
        url,
        filename: storedName,
        mimeType,
        kind: kindFromExt(ext),
        alt: opts?.alt || storedName.replace(/\.\w+$/, ''),
        title: opts?.alt || storedName,
        description: `source:${abs}`,
        width: null,
        height: null,
        sizeBytes: buf.length,
        usageHints: logoStripped ? ['technolife', 'logo-stripped'] : ['technolife'],
      })

      imported.push(url)
      items.push({ sourceUrl: abs, storedUrl: url })
      logger.info(
        { url, source: abs, logoStripped },
        '[TechnolifeImporter] Downloading images'
      )
    } catch (err) {
      warnings.push(`خطای تصویر: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { urls: imported, items, warnings }
}

export function rewriteImportedHtmlImages(
  html: string | null,
  pageUrl: string,
  items: Array<{ sourceUrl: string; storedUrl: string }>,
  removeMissing = false
): string | null {
  if (!html) return null
  const bySource = new Map(items.map((item) => [item.sourceUrl, item.storedUrl]))
  const rewritten = html.replace(
    /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
    (tag, raw: string) => {
      const sourceUrl = normalizeImageUrl(raw, pageUrl)
      const storedUrl = sourceUrl ? bySource.get(sourceUrl) : null
      if (!storedUrl) return removeMissing ? '' : tag
      return tag.replace(/(\bsrc=["'])[^"']+(["'])/i, `$1${storedUrl}$2`)
    }
  )
  return rewritten.trim() || null
}

/** Ensure product URL allowlist helper remains imported for callers that need it */
export function assertProductUrlAllowed(url: string) {
  return validateTechnolifeUrl(url)
}
