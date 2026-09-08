import type { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import { mkdir, unlink } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { basename, extname } from 'node:path'
import { mediaKindFromMime, type MediaKind } from '#models/media_asset'

export const MEDIA_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])
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

  const dir = app.makePath('storage/uploads')
  await mkdir(dir, { recursive: true })
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  await file.move(dir, { name, overwrite: false })

  if (file.state !== 'moved') {
    return {
      ok: false as const,
      error: 'ذخیره فایل ناموفق بود',
    }
  }

  const url = `/uploads/${name}`
  const mimeType = file.type && file.subtype
    ? `${file.type}/${file.subtype}`
    : mimeFromExt(ext)

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

/** Normalize stored / legacy absolute APP_URL upload links to `/uploads/{name}`. */
export function toPublicMediaUrl(url: string) {
  const name = parseStoredUploadName(url)
  if (name) return `/uploads/${name}`
  return url
}

export function parseStoredUploadName(url: string) {
  try {
    const path = url.split('?')[0] || url
    const part = path.split('/').pop() || ''
    const name = basename(part)
    if (!name || name !== part) return null
    if (!/^[\w.-]+\.(jpe?g|png|webp|gif|mp4|webm|mov|pdf|txt|docx?)$/i.test(name)) return null
    return name
  } catch {
    return null
  }
}

export async function deleteStoredUpload(url: string) {
  const name = parseStoredUploadName(url)
  if (!name) return
  const filePath = app.makePath('storage/uploads', name)
  try {
    await unlink(filePath)
  } catch {
    /* ignore missing file */
  }
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
