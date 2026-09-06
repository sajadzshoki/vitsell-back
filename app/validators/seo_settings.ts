import vine from '@vinejs/vine'

export const seoSettingsValidator = vine.compile(
  vine.object({
    siteName: vine.string().trim().minLength(1).optional(),
    siteUrl: vine.string().trim().minLength(1).optional(),
    titlePattern: vine.string().trim().optional(),
    defaultRobots: vine
      .enum(['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'] as const)
      .optional(),
    defaultOgImage: vine.string().trim().optional(),
    twitterCard: vine.enum(['summary', 'summary_large_image'] as const).optional(),
  })
)
