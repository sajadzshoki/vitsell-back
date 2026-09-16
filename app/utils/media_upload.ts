import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomBytes } from 'node:crypto'
import { basename, extname } from 'node:path'
import drive from '@adonisjs/drive/services/main'
import env from '#start/env'
import { mediaKindFromMime, type MediaKind } from '#models/media_asset'

export const MEDIA_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])
export const MEDIA_VIDEO_EXT = new Set(['mp4', 'webm', 'mov'])
export const MEDIA_DOC_EXT = new Set(['pdf', 'txt', 'doc', 'docx'])
export const MEDIA_ALLOWED_EXT = new Set([
  ...MEDIA_IMAGE_EXT,
  ...MEDIA_VIDEO_EXT,
  ...MEDIA_DOC_EXT,
])

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
  txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export function normalizeExt(file: MultipartFile) {
  return String(file.extname || extname(file.clientName || '').slice(1) || '')
    .toLowerCase()
    .replace(/^\./, '')
}

export function mimeFromExt(ext: string, fallback = 'application/octet-stream') {
  return MIME_BY_EXT[ext] || fallback
}

export function kindFromExt(ext: string): MediaKind {
  if (MEDIA_IMAGE_EXT.has(ext)) return 'image'
  if (MEDIA_VIDEO_EXT.has(ext)) return 'video'
  if (MEDIA_DOC_EXT.has(ext)) return 'document'
  return mediaKindFromMime(mimeFromExt(ext))
}

export async function saveUploadedMediaFile(file: MultipartFile, opts?: { maxSize?: string }) {
  const maxSize = opts?.maxSize || '20mb'
  const ext = normalizeExt(file)

  if (!file.isValid) {
    return {
      ok: false as const,
      error: file.errors[0]?.message || 'فایل نامعتبر است',
    }
  }

  if (!MEDIA_ALLOWED_EXT.has(ext)) {
    return {
      ok: false as const,
      error: 'فرمت فایل مجاز نیست',
    }
  }

  // Re-validate size bound for media library (images stay small; video/docs up to 20mb)
  if (file.size && file.size > parseSize(maxSize)) {
    return {
      ok: false as const,
      error: 'حجم فایل بیش از حد مجاز است',
    }
  }

  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const mimeType = file.type && file.subtype
    ? `${file.type}/${file.subtype}`
    : mimeFromExt(ext)

  try {
    await file.moveToDisk(name, {
      contentType: mimeType,
      visibility: 'public',
    })
  } catch {
    return {
      ok: false as const,
      error: 'ذخیره فایل ناموفق بود',
    }
  }

  const url = `/uploads/${name}`

  return {
    ok: true as const,
    url,
    storedName: name,
    filename: file.clientName || name,
    mimeType,
    kind: kindFromExt(ext),
    sizeBytes: typeof file.size === 'number' ? file.size : null,
  }
}

/**
 * Public URL for clients.
 * - With S3_PUBLIC_URL (MinIO/CDN): direct object URL for Drive uploads
 * - Otherwise: `/uploads/{name}` served by the API (streams from Drive)
 * - Non-upload paths (`/images/...`, external CDNs, bare mock filenames) stay unchanged
 */
export function toPublicMediaUrl(url: string) {
  const raw = String(url || '').trim()
  if (!raw) return raw

  const name = parseStoredUploadName(raw)
  if (!name) return raw

  const publicBase = String(env.get('S3_PUBLIC_URL') || '')
    .trim()
    .replace(/\/+$/, '')

  if (publicBase && (raw === `${publicBase}/${name}` || raw.startsWith(`${publicBase}/`))) {
    return `${publicBase}/${name}`
  }

  const isDriveUpload =
    raw.startsWith('/uploads/')
    || /(?:^|\/)uploads\/[\w.-]+\.(?:jpe?g|png|webp|gif|svg|mp4|webm|mov|pdf|txt|docx?)$/i.test(raw)

  if (!isDriveUpload) return raw

  if (publicBase && env.get('DRIVE_DISK') === 's3') {
    return `${publicBase}/${name}`
  }

  return `/uploads/${name}`
}

export function parseStoredUploadName(url: string) {
  try {
    const path = url.split('?')[0] || url
    const part = path.split('/').pop() || ''
    const name = basename(part)
    if (!name || name !== part) return null
    if (!/^[\w.-]+\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|pdf|txt|docx?)$/i.test(name)) return null
    return name
  } catch {
    return null
  }
}

export async function deleteStoredUpload(url: string) {
  const name = parseStoredUploadName(url)
  if (!name) return
  try {
    await drive.use().delete(name)
  } catch {
    /* ignore missing file */
  }
}

/** Stream a stored upload from the active Drive disk (MinIO or local fs). */
export async function openStoredUpload(name: string) {
  const disk = drive.use()
  if (!(await disk.exists(name))) return null

  const [stream, meta] = await Promise.all([
    disk.getStream(name),
    disk.getMetaData(name).catch(() => null),
  ])

  return { stream, meta }
}

function parseSize(input: string) {
  const m = String(input).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i)
  if (!m) return 2 * 1024 * 1024
  const n = Number(m[1])
  const unit = (m[2] || 'b').toLowerCase()
  if (unit === 'gb') return n * 1024 * 1024 * 1024
  if (unit === 'mb') return n * 1024 * 1024
  if (unit === 'kb') return n * 1024
  return n
}
