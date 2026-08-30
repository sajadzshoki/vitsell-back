import ContactMessage from '#models/contact_message'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class ContactController {
  async store({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2),
        phone: vine.string().trim().regex(/^09\d{9}$/),
        email: vine.string().email().optional(),
        subject: vine.string().trim().minLength(2),
        message: vine.string().trim().minLength(10),
      })
    )
    const payload = await request.validateUsing(validator)

    const row = await ContactMessage.create({
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email ?? null,
      subject: payload.subject,
      message: payload.message,
    })

    return response.created({
      message: 'پیام شما ثبت شد',
      id: row.id,
    })
  }
}
