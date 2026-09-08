import vine from '@vinejs/vine'

const reviewStatuses = [
  'all',
  'unanswered',
  'answered',
  'pending',
  'approved',
  'rejected',
  'hidden',
] as const

const moderationStatuses = ['pending', 'approved', 'rejected', 'hidden'] as const

export const reviewsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(reviewStatuses).optional(),
    rating: vine.number().min(1).max(5).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type ReviewsQuery = Awaited<ReturnType<(typeof reviewsQueryValidator)['validate']>>

export const replyReviewValidator = vine.compile(
  vine.object({
    reply: vine.string().trim().minLength(1).maxLength(4000),
  })
)

export const updateReviewTextValidator = vine.compile(
  vine.object({
    text: vine.string().trim().minLength(10).maxLength(2000).optional(),
    reply: vine.string().trim().minLength(1).maxLength(4000).nullable().optional(),
  })
)

export const updateReviewModerationValidator = vine.compile(
  vine.object({
    moderation: vine.enum(moderationStatuses),
  })
)

export const bulkReviewModerationValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim()).minLength(1),
    moderation: vine.enum(moderationStatuses),
  })
)
