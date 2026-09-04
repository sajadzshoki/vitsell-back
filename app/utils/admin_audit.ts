import AuditLog from '#models/audit_log'
import type { AuditAction, AuditEntity } from '#models/audit_log'
import User from '#models/user'
import Profile from '#models/profile'

export type RecordAuditInput = {
  action: AuditAction | string
  entity: AuditEntity | string
  entityId?: string | number | null
  summary: string
  previousValue?: string | null
  newValue?: string | null
  /** Override display name; defaults from profile */
  actorName?: string | null
}

function newAuditId() {
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function resolveActorDisplayName(user: User | null | undefined, fallback = 'سیستم') {
  if (!user) return fallback
  try {
    await user.load('profile')
  } catch {
    /* ignore */
  }
  const profile = user.profile
  if (profile) {
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    if (name) return name
  } else {
    const row = await Profile.findBy('userId', user.id)
    if (row) {
      const name = `${row.firstName || ''} ${row.lastName || ''}`.trim()
      if (name) return name
    }
  }
  return user.phone || `ادمین #${user.id}`
}

/** Append-only audit write. Never throws to callers — failures are swallowed. */
export async function recordAdminAudit(actor: User | null | undefined, input: RecordAuditInput) {
  try {
    const actorName =
      (input.actorName && String(input.actorName).trim())
      || (await resolveActorDisplayName(actor))

    const row = await AuditLog.create({
      id: newAuditId(),
      actorId: actor?.id ?? null,
      actorName,
      action: String(input.action || 'other'),
      entity: String(input.entity || 'system'),
      entityId: input.entityId == null ? '' : String(input.entityId),
      summary: String(input.summary || '').trim() || '—',
      previousValue: input.previousValue == null ? null : String(input.previousValue),
      newValue: input.newValue == null ? null : String(input.newValue),
    })
    return row
  } catch {
    return null
  }
}
