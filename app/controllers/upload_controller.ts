import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { mkdir } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { basename } from 'node:path'

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

export default class UploadController {
  async store({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '2mb',
      extnames: [...ALLOWED_EXT],
    })

    if (!file) {
      return response.badRequest({
        errors: [{ field: 'file', message: 'فایل ارسال نشده است' }],
      })
    }

    if (!file.isValid) {
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: file.errors[0]?.message || 'فایل نامعتبر است' }],
      })
    }

    const ext = String(file.extname || '').toLowerCase()
    if (!ALLOWED_EXT.has(ext)) {
      return response.unprocessableEntity({
        errors: [{ field: 'file', message: 'فرمت تصویر مجاز نیست' }],
      })
    }

    const dir = app.makePath('storage/uploads')
    await mkdir(dir, { recursive: true })
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
    await file.move(dir, { name, overwrite: false })

    if (file.state !== 'moved') {
      return response.badRequest({
        errors: [{ field: 'file', message: 'ذخیره فایل ناموفق بود' }],
      })
    }

    const base = env.get('APP_URL').replace(/\/$/, '')
    return response.created({ url: `${base}/uploads/${name}` })
  }

  async show({ params, response }: HttpContext) {
    const file = basename(String(params.file || ''))
    if (!file || file !== params.file || !/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(file)) {
      return response.badRequest({
        errors: [{ field: 'file', message: 'نام فایل نامعتبر است' }],
      })
    }

    const filePath = app.makePath('storage/uploads', file)
    return response.download(filePath)
  }
}
