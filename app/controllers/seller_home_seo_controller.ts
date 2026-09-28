import { adminHasPermission } from '#utils/seller_admins'
import { loadHomeSeoBlocks, saveHomeSeoBlocks, type HomeSeoBlock } from '#utils/home_seo'
import { homeSeoValidator } from '#validators/home_seo'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerHomeSeoController {
  async show({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!(await adminHasPermission(user, 'pages.view'))) {
      return response.forbidden({ errors: [{ message: 'دسترسی به متن صفحه اصلی مجاز نیست' }] })
    }
    return response.ok({ blocks: await loadHomeSeoBlocks() })
  }

  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!(await adminHasPermission(user, 'pages.update'))) {
      return response.forbidden({ errors: [{ message: 'ویرایش متن صفحه اصلی مجاز نیست' }] })
    }
    const payload = await request.validateUsing(homeSeoValidator)
    const blocks: HomeSeoBlock[] = payload.blocks.map((block) => {
      const next: HomeSeoBlock = {
        title: block.title,
        paragraphs: block.paragraphs,
      }
      const label = block.inlineLink?.label?.trim()
      const to = block.inlineLink?.to?.trim()
      if (label && to) next.inlineLink = { label, to }
      return next
    })
    return response.ok({ blocks: await saveHomeSeoBlocks(blocks) })
  }
}
