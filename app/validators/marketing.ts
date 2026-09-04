import vine from '@vinejs/vine'

export const marketingSummaryQueryValidator = vine.compile(
  vine.object({
    from: vine.string().trim().optional(),
    to: vine.string().trim().optional(),
  })
)

export type MarketingSummaryQuery = Awaited<
  ReturnType<(typeof marketingSummaryQueryValidator)['validate']>
>
