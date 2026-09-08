import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { basename } from 'node:path'
import {
  deleteStoredUpload,
  MEDIA_IMAGE_EXT,
  saveUploadedMediaFile,
  toPublicMediaUrl,
} from '#utils/media_upload'

export default class UploadController {
  async store({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '2mb',
      extnames: [...MEDIA_IMAGE_EXT],
    })

    if (!file) {
      return response.badRequest({
        errors: [{ field: 'file', message: 'فایل ارسال نشده است' }],
      })
    }

    const saved = await saveUploadedMediaFile(file, { maxSize: '2mb' })
    if (!saved.ok) {
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: saved.error }],
      })
    }

    if (saved.kind !== 'image') {
      await deleteStoredUpload(saved.url)
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: 'فرمت تصویر مجاز نیست' }],
      })
    }

    return response.created({ url: toPublicMediaUrl(saved.url) })
  }

  async show({ params, response }: HttpContext) {
    const file = basename(String(params.file || ''))
    if (
      !file
      || file !== params.file
      || !/^[\w.-]+\.(jpe?g|png|webp|gif|mp4|webm|mov|pdf|txt|docx?)$/i.test(file)
    ) {
      return response.badRequest({
        errors: [{ field: 'file', message: 'نام فایل نامعتبر است' }],
      })
    }

    const filePath = app.makePath('storage/uploads', file)
    return response.download(filePath)
  }
}
