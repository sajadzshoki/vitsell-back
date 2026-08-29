import Notification from '#models/notification'
import type { HttpContext } from '@adonisjs/core/http'

export default class NotificationsController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const list = await Notification.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
    return response.ok(list.map((n) => n.toJSON()))
  }

  async markRead({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const item = await Notification.query()
      .where('user_id', user.id)
      .where('id', params.id)
      .first()
    if (!item) {
      return response.notFound({ errors: [{ field: 'id', message: 'اعلان یافت نشد' }] })
    }
    item.read = true
    await item.save()
    return response.ok(item.toJSON())
  }

  async markAllRead({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await Notification.query().where('user_id', user.id).update({ read: true })
    return response.ok({ ok: true })
  }
}
