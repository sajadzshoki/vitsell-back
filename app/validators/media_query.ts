import vine from '@vinejs/vine'

export const mediaKinds = ['all', 'image', 'video', 'document', 'other'] as const

export const mediaQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    kind: vine.enum(mediaKinds).optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type MediaQuery = Awaited<ReturnType<(typeof mediaQueryValidator)['validate']>>
