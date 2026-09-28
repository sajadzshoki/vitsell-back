import vine from '@vinejs/vine'

export const homeSeoValidator = vine.compile(
  vine.object({
    blocks: vine.array(
      vine.object({
        title: vine.string().trim().minLength(1).maxLength(160),
        paragraphs: vine.array(
          vine.string().trim().minLength(1).maxLength(4000),
        ).minLength(1).maxLength(8),
        inlineLink: vine.object({
          label: vine.string().trim().minLength(1).maxLength(80),
          to: vine.string().trim().minLength(1).maxLength(300),
        }).optional().nullable(),
      }),
    ).minLength(1).maxLength(12),
  }),
)
