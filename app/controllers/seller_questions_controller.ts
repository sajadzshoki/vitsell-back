import ProductQuestion from '#models/product_question'
import {
  questionsQueryValidator,
  replyQuestionValidator,
  setQuestionVerifiedValidator,
} from '#validators/questions'
import { querySellerQuestions } from '#utils/seller_questions_query'
import type { HttpContext } from '@adonisjs/core/http'

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default class SellerQuestionsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    if (qs.q === '') delete qs.q
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await questionsQueryValidator.validate(qs)
    return response.ok(await querySellerQuestions(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await ProductQuestion.find(params.id)
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    return response.ok(row.toJSON())
  }

  async reply({ params, request, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }

    const payload = await request.validateUsing(replyQuestionValidator)
    const previous = question.answer
    question.answer = {
      author: payload.author?.trim() || 'کارشناس دیجی‌شاپ',
      date: jalaliishDate(),
      text: payload.text.trim(),
      helpfulYes: previous?.helpfulYes ?? 0,
      helpfulNo: previous?.helpfulNo ?? 0,
      role: 'support',
    }
    await question.save()
    return response.ok(question.toJSON())
  }

  async clearAnswer({ params, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    question.answer = null
    await question.save()
    return response.ok(question.toJSON())
  }

  async setVerified({ params, request, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    const payload = await request.validateUsing(setQuestionVerifiedValidator)
    question.verified = payload.verified
    await question.save()
    return response.ok(question.toJSON())
  }

  async destroy({ params, response }: HttpContext) {
    const question = await ProductQuestion.find(params.id)
    if (!question) {
      return response.notFound({ errors: [{ field: 'id', message: 'پرسش یافت نشد' }] })
    }
    await question.delete()
    return response.ok({ ok: true })
  }
}
