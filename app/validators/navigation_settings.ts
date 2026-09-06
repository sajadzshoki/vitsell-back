import vine from '@vinejs/vine'

const quickLinkSchema = vine.object({
  id: vine.string().trim().minLength(1),
  label: vine.string().trim().minLength(1),
  icon: vine.string().trim().optional(),
  to: vine.string().trim().optional(),
  badge: vine.string().trim().optional(),
  accent: vine.boolean().optional(),
  enabled: vine.boolean().optional(),
  external: vine.boolean().optional(),
})

const bottomLinkSchema = vine.object({
  id: vine.string().trim().minLength(1),
  label: vine.string().trim().minLength(1),
  icon: vine.string().trim().minLength(1),
  iconActive: vine.string().trim().optional(),
  to: vine.string().trim().optional(),
  badge: vine.string().trim().optional(),
  enabled: vine.boolean().optional(),
})

export const navigationSettingsValidator = vine.compile(
  vine.object({
    quickLinks: vine.array(quickLinkSchema).minLength(1),
    bottomLinks: vine.array(bottomLinkSchema).minLength(1),
  })
)
