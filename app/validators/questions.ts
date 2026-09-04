import vine from '@vinejs/vine'

const questionStatuses = ['all', 'unanswered', 'answered'] as const

export const questionsQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(questionStatuses).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type QuestionsQuery = Awaited<ReturnType<(typeof questionsQueryValidator)['validate']>>

export const replyQuestionValidator = vine.compile(
  vine.object({
    text: vine.string().trim().minLength(2).maxLength(2000),
    author: vine.string().trim().minLength(2).maxLength(80).optional(),
  })
)

export const setQuestionVerifiedValidator = vine.compile(
  vine.object({
    verified: vine.boolean(),
  })
)
