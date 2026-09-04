import MediaAsset, { mediaKindFromMime, type MediaKind } from '#models/media_asset'
import {
  bulkDeleteMediaValidator,
  registerMediaValidator,
  updateMediaValidator,
} from '#validators/media'
import { mediaQueryValidator } from '#validators/media_query'
import { parseMediaListQs, querySellerMedia } from '#utils/seller_media_query'
import {
  deleteStoredUpload,
  MEDIA_ALLOWED_EXT,
  saveUploadedMediaFile,
} from '#utils/media_upload'
import type { HttpContext } from '@adonisjs/core/http'

function filenameFromUrl(url: string) {
  try {
    const path = url.split('?')[0] || url
    const part = path.split('/').pop() || 'file'
    return decodeURIComponent(part)
  } catch {
    return 'file'
  }
}

function optionalInt(value: unknown) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

export default class SellerMediaController {
  async index({ request, response }: HttpContext) {
    const filters = await mediaQueryValidator.validate(parseMediaListQs({ ...request.qs() }))
    return response.ok(await querySellerMedia(filters))
  }

  async show({ params, response }: HttpContext) {
    const item = await MediaAsset.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'رسانه یافت نشد' }] })
    }
    return response.ok(item.toAdminJSON())
  }

  /** Multipart upload → create media asset */
  async store({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '20mb',
      extnames: [...MEDIA_ALLOWED_EXT],
    })

    if (!file) {
      return response.badRequest({
        errors: [{ field: 'file', message: 'فایل ارسال نشده است' }],
      })
    }

    const saved = await saveUploadedMediaFile(file, { maxSize: '20mb' })
    if (!saved.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: saved.error }],
      })
    }

    const alt = String(request.input('alt') || '').trim()
    const title = String(request.input('title') || '').trim()
    const description = String(request.input('description') || '').trim()
    const width = optionalInt(request.input('width'))
    const height = optionalInt(request.input('height'))

    const id = `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const item = await MediaAsset.create({
      id,
      url: saved.url,
      filename: saved.filename,
      mimeType: saved.mimeType,
      kind: saved.kind,
      alt: alt || saved.filename.replace(/\.\w+$/, ''),
      title: title || saved.filename,
      description,
      width,
      height,
      sizeBytes: saved.sizeBytes,
      usageHints: [],
    })

    return response.created(item.toAdminJSON())
  }

  /** Register an already-hosted URL into the library */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerMediaValidator)
    const url = payload.url.trim()
    const existing = await MediaAsset.query().where('url', url).first()
    if (existing) {
      return response.ok(existing.toAdminJSON())
    }

    const filename = payload.filename?.trim() || filenameFromUrl(url)
    const mimeType = payload.mimeType?.trim() || 'application/octet-stream'
    const kind = (payload.kind || mediaKindFromMime(mimeType)) as MediaKind
    const id = `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

    const item = await MediaAsset.create({
      id,
      url,
      filename,
      mimeType,
      kind,
      alt: payload.alt?.trim() || filename.replace(/\.\w+$/, ''),
      title: payload.title?.trim() || filename,
      description: payload.description?.trim() || '',
      width: payload.width ?? null,
      height: payload.height ?? null,
      sizeBytes: payload.sizeBytes ?? null,
      usageHints: payload.usageHints || [],
    })

    return response.created(item.toAdminJSON())
  }

  async update({ params, request, response }: HttpContext) {
    const item = await MediaAsset.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'رسانه یافت نشد' }] })
    }

    const payload = await request.validateUsing(updateMediaValidator)
    if (payload.alt !== undefined) item.alt = payload.alt.trim()
    if (payload.title !== undefined) item.title = payload.title.trim()
    if (payload.description !== undefined) item.description = payload.description.trim()
    if (payload.usageHints !== undefined) item.usageHints = payload.usageHints
    await item.save()
    return response.ok(item.toAdminJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const item = await MediaAsset.find(params.id)
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'رسانه یافت نشد' }] })
    }
    const url = item.url
    await item.delete()
    await deleteStoredUpload(url)
    return response.ok({ message: 'رسانه حذف شد' })
  }

  async bulkDestroy({ request, response }: HttpContext) {
    const { ids } = await request.validateUsing(bulkDeleteMediaValidator)
    const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
    const rows = await MediaAsset.query().whereIn('id', unique)
    for (const row of rows) {
      const url = row.url
      await row.delete()
      await deleteStoredUpload(url)
    }
    return response.ok({ deleted: rows.length })
  }
}
