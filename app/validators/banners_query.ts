import vine from '@vinejs/vine'
import { scheduleListStatuses } from '#utils/seller_schedule_filters'

const placements = [
  'homepage_hero',
  'homepage_promo_strip',
  'homepage_category',
  'homepage_product_section',
  'product_listing',
  'category_page',
  'category_page_hero',
  'category_page_promo',
  'product_detail',
  'sidebar',
  'footer_promo',
] as const

export const bannersQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    status: vine.enum(scheduleListStatuses).optional(),
    placement: vine.enum(['all', ...placements] as const).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type BannersQuery = Awaited<ReturnType<(typeof bannersQueryValidator)['validate']>>
