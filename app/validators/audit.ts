import vine from '@vinejs/vine'

const auditActions = [
  'create',
  'update',
  'delete',
  'status_change',
  'login',
  'permission_change',
  'other',
] as const

const auditEntities = [
  'product',
  'order',
  'category',
  'promotion',
  'banner',
  'admin',
  'role',
  'inventory',
  'customer',
  'settings',
  'system',
  'payment',
  'refund',
  'settlement',
  'adjustment',
  'finance',
] as const

export const auditQueryValidator = vine.compile(
  vine.object({
    q: vine.string().trim().optional(),
    action: vine.enum(['all', ...auditActions] as const).optional(),
    entity: vine.enum(['all', ...auditEntities] as const).optional(),
    actorId: vine.string().trim().optional(),
    mode: vine.enum(['audit', 'activity'] as const).optional(),
    dateFrom: vine.string().trim().optional(),
    dateTo: vine.string().trim().optional(),
    page: vine.number().min(1).optional(),
    pageSize: vine.number().min(1).max(200).optional(),
    all: vine.boolean().optional(),
  })
)

export type AuditQuery = Awaited<ReturnType<(typeof auditQueryValidator)['validate']>>

export const storeAuditValidator = vine.compile(
  vine.object({
    action: vine.enum(auditActions),
    entity: vine.enum(auditEntities),
    entityId: vine.string().trim().optional(),
    summary: vine.string().trim().minLength(1).maxLength(500),
    previousValue: vine.string().trim().nullable().optional(),
    newValue: vine.string().trim().nullable().optional(),
  })
)
