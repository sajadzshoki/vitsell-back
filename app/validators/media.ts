import vine from '@vinejs/vine'
import { mediaKinds } from '#validators/media_query'

const kinds = mediaKinds.filter((k) => k !== 'all') as ['image', 'video', 'document', 'other']

export const updateMediaValidator = vine.compile(
  vine.object({
    alt: vine.string().trim().optional(),
    title: vine.string().trim().optional(),
    description: vine.string().trim().optional(),
    usageHints: vine.array(vine.string().trim()).optional(),
  })
)

export const registerMediaValidator = vine.compile(
  vine.object({
    url: vine.string().trim().minLength(1),
    filename: vine.string().trim().optional(),
    mimeType: vine.string().trim().optional(),
    kind: vine.enum(kinds).optional(),
    alt: vine.string().trim().optional(),
    title: vine.string().trim().optional(),
    description: vine.string().trim().optional(),
    width: vine.number().min(0).nullable().optional(),
    height: vine.number().min(0).nullable().optional(),
    sizeBytes: vine.number().min(0).nullable().optional(),
    usageHints: vine.array(vine.string().trim()).optional(),
  })
)

export const bulkDeleteMediaValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string().trim().minLength(1)).minLength(1),
  })
)
