import Category from '#models/category'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.query().orderBy('id', 'asc')
    return response.ok(categories.map((c) => c.toJSON()))
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok(category.toJSON())
  }

  async pageMeta({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return response.notFound({ errors: [{ field: 'id', message: 'دسته‌بندی یافت نشد' }] })
    }
    return response.ok({
      meta: category.pageMeta,
      suggested: category.suggested ?? [],
    })
  }
}
