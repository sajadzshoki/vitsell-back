import SellerReview from '#models/seller_review'
import {
  bulkReviewModerationValidator,
  replyReviewValidator,
  reviewsQueryValidator,
  updateReviewModerationValidator,
} from '#validators/reviews'
import { querySellerReviews } from '#utils/seller_reviews_query'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerReviewsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize', 'rating'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await reviewsQueryValidator.validate(qs)
    return response.ok(await querySellerReviews(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await SellerReview.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    return response.ok(row.toAdminJSON())
  }

  async reply({ params, request, response }: HttpContext) {
    const row = await SellerReview.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    const payload = await request.validateUsing(replyReviewValidator)
    row.reply = payload.reply.trim()
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async setModeration({ params, request, response }: HttpContext) {
    const row = await SellerReview.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'نظر یافت نشد' }] })
    }
    const payload = await request.validateUsing(updateReviewModerationValidator)
    row.moderation = payload.moderation
    await row.save()
    return response.ok(row.toAdminJSON())
  }

  async bulkModeration({ request, response }: HttpContext) {
    const payload = await request.validateUsing(bulkReviewModerationValidator)
    const ids = [...new Set(payload.ids.map((id) => id.trim()).filter(Boolean))]
    if (!ids.length) {
      return response.unprocessableEntity({
        errors: [{ field: 'ids', message: 'شناسه نظر معتبر نیست' }],
      })
    }

    await SellerReview.query().whereIn('id', ids).update({ moderation: payload.moderation })
    return response.ok({ updated: ids.length, moderation: payload.moderation })
  }
}
