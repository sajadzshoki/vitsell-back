import User from '#models/user'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

type UserQuery = ModelQueryBuilderContract<typeof User, User>

export function isCourierUser(user: Pick<User, 'isCourier' | 'role'>) {
  return Boolean(user.isCourier) || user.role === 'courier'
}

export function isActiveCourier(user: Pick<User, 'isCourier' | 'courierActive' | 'role' | 'status'>) {
  if (Boolean(user.isCourier)) return Boolean(user.courierActive)
  return user.role === 'courier' && user.status === 'active'
}

export function courierDisplayName(user: User) {
  const named = String(user.courierName || '').trim()
  if (named) return named
  const profile = user.profile
  const fromProfile = [profile?.firstName, profile?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
  return fromProfile || user.phone
}

export function applyCourierRoster(query: UserQuery) {
  return query.where((builder) => {
    builder.where('is_courier', true).orWhere('role', 'courier')
  })
}

export function applyActiveCourier(query: UserQuery) {
  return query.where((builder) => {
    builder
      .where((inner) => inner.where('is_courier', true).where('courier_active', true))
      .orWhere((inner) => inner.where('role', 'courier').where('status', 'active'))
  })
}
