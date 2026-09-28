import vine from '@vinejs/vine'

const linkSchema = vine.object({
  id: vine.string().trim().minLength(1).maxLength(80),
  label: vine.string().trim().minLength(1).maxLength(80),
  to: vine.string().trim().maxLength(500).optional(),
})

export const topStripValidator = vine.compile(
  vine.object({
    enabled: vine.boolean(),
    supportLabel: vine.string().trim().maxLength(80),
    supportPhone: vine.string().trim().maxLength(40),
    highlight: vine.string().trim().maxLength(160),
    links: vine.array(linkSchema).maxLength(6),
  }),
)
