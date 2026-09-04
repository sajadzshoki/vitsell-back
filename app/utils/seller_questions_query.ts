import ProductQuestion from '#models/product_question'
import type { QuestionsQuery } from '#validators/questions'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type QuestionQuery = ModelQueryBuilderContract<typeof ProductQuestion, ProductQuestion>

function applyFilters(
  query: QuestionQuery,
  filters: QuestionsQuery,
  options?: { includeStatus?: boolean }
) {
  let q = query
  const includeStatus = options?.includeStatus !== false
  const status = filters.status

  if (includeStatus && status && status !== 'all') {
    if (status === 'unanswered') {
      q = q.whereNull('answer')
    } else if (status === 'answered') {
      q = q.whereNotNull('answer')
    }
  }

  const search = filters.q?.trim()
  if (search) {
    const like = `%${search}%`
    q = q.where((builder) => {
      builder
        .whereILike('id', like)
        .orWhereILike('name', like)
        .orWhereILike('question', like)
        .orWhereILike('product_id', like)
        .orWhereExists((sub) => {
          sub
            .from('products as p')
            .whereRaw('p.id = product_questions.product_id')
            .whereILike('p.title', like)
        })
    })
  }

  return q
}

async function statusCounts(filters: QuestionsQuery) {
  const base = () => applyFilters(ProductQuestion.query(), filters, { includeStatus: false })
  const [allRow, unansweredRow, answeredRow] = await Promise.all([
    base().count('* as total').first(),
    base().whereNull('answer').count('* as total').first(),
    base().whereNotNull('answer').count('* as total').first(),
  ])
  const num = (row: any) => Number(row?.$extras?.total ?? row?.total ?? 0)
  return {
    all: num(allRow),
    unanswered: num(unansweredRow),
    answered: num(answeredRow),
  }
}

export async function querySellerQuestions(filters: QuestionsQuery) {
  const wantAll = filters.all === true
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || (wantAll ? 200 : 10)))

  const filtered = applyFilters(ProductQuestion.query(), filters).orderBy('created_at', 'desc')
  const countRow = await applyFilters(ProductQuestion.query(), filters).count('* as total').first()
  const total = Number((countRow as any)?.$extras?.total ?? (countRow as any)?.total ?? 0)

  const items = wantAll
    ? await filtered.limit(pageSize)
    : await filtered.offset((page - 1) * pageSize).limit(pageSize)

  return {
    items: items.map((row) => row.toJSON()),
    total,
    page: wantAll ? 1 : page,
    pageSize: wantAll ? items.length : pageSize,
    statusCounts: await statusCounts(filters),
  }
}
