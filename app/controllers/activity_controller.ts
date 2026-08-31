import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import {
  recommendProducts,
  scoreCategoriesForUser,
  storeActivities,
  type IncomingActivity,
} from '#services/recommendation_service'

const eventSchema = vine.object({
  type: vine.enum(['product_view', 'category_view', 'search', 'add_to_cart', 'wishlist'] as const),
  productId: vine.string().optional(),
  category: vine.string().optional(),
  query: vine.string().optional(),
  at: vine.number().optional(),
})

const storeValidator = vine.compile(
  vine.object({
    events: vine.array(eventSchema).minLength(1).maxLength(100),
  })
)

export default class ActivityController {
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { events } = await request.validateUsing(storeValidator)
    const result = await storeActivities(user.id, events as IncomingActivity[])
    return response.ok(result)
  }

  async sync({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { events } = await request.validateUsing(storeValidator)
    const result = await storeActivities(user.id, events as IncomingActivity[])
    return response.ok(result)
  }

  async recommendations({ auth, request, response }: HttpContext) {
    const limit = Number(request.input('limit', 12)) || 12
    const hintRaw = String(request.input('categories', '')).trim()
    const hintCategories = hintRaw
      ? hintRaw.split(',').map((c) => c.trim()).filter(Boolean).slice(0, 5)
      : []
    const excludeRaw = String(request.input('exclude', '')).trim()
    const excludeProductIds = excludeRaw
      ? excludeRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : []

    let categories = hintCategories
    if (auth.user) {
      categories = await scoreCategoriesForUser(auth.user.id, hintCategories)
    }

    const result = await recommendProducts({
      categories,
      excludeProductIds,
      limit,
    })
    return response.ok(result)
  }
}
