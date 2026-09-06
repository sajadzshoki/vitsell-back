import vine from '@vinejs/vine'

export const seoRedirectValidator = vine.compile(
  vine.object({
    source: vine.string().trim().minLength(1),
    destination: vine.string().trim().minLength(1),
    type: vine.enum([301, 308, 302] as const).optional(),
    active: vine.boolean().optional(),
  })
)
