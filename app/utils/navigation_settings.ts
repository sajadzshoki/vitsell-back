import ContentBlock from '#models/content_block'

export const NAVIGATION_SETTINGS_KEY = 'navigationSettings'

export type NavQuickLinkPayload = {
  id: string
  label: string
  icon?: string
  to?: string
  badge?: string
  accent?: boolean
  enabled: boolean
  external?: boolean
}

export type NavBottomLinkPayload = {
  id: string
  label: string
  icon: string
  iconActive?: string
  to?: string
  badge?: 'cart' | string
  enabled: boolean
}

export type NavigationSettingsPayload = {
  quickLinks: NavQuickLinkPayload[]
  bottomLinks: NavBottomLinkPayload[]
}

export const defaultNavigationSettings: NavigationSettingsPayload = {
  quickLinks: [
    {
      id: 'categories',
      label: 'دسته بندی محصولات',
      icon: 'menu-2',
      to: '/category',
      enabled: true,
    },
    {
      id: 'corporate',
      label: 'خرید سازمانی',
      icon: 'building-store',
      to: '/category/home',
      enabled: true,
    },
    {
      id: 'gift-card',
      label: 'کارت هدیه',
      icon: 'gift',
      to: '/category/fashion',
      enabled: true,
    },
    {
      id: 'stock',
      label: 'کالاهای استوک',
      icon: 'package',
      to: '/category/laptop',
      badge: 'جدید',
      enabled: true,
    },
    {
      id: 'installment',
      label: 'خرید اقساطی',
      icon: 'wallet',
      to: '/category/mobile',
      enabled: true,
    },
  ],
  bottomLinks: [
    {
      id: 'home',
      label: 'خانه',
      icon: 'home',
      iconActive: 'home-filled',
      to: '/',
      enabled: true,
    },
    {
      id: 'categories',
      label: 'دسته‌ها',
      icon: 'layout-grid',
      iconActive: 'layout-grid-filled',
      to: '/category',
      enabled: true,
    },
    {
      id: 'cart',
      label: 'سبد خرید',
      icon: 'shopping-cart',
      iconActive: 'shopping-cart-filled',
      to: '/cart',
      badge: 'cart',
      enabled: true,
    },
    {
      id: 'account',
      label: 'حساب من',
      icon: 'user',
      iconActive: 'user-filled',
      to: '/account',
      enabled: true,
    },
  ],
}

function asString(value: unknown, fallback = '') {
  if (value == null) return fallback
  return String(value)
}

function normalizeQuick(raw: unknown, index: number): NavQuickLinkPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = asString(src.id, `quick-${index + 1}`) || `quick-${index + 1}`
  const to = asString(src.to)
  return {
    id,
    label: asString(src.label, id),
    icon: asString(src.icon) || undefined,
    to: to || undefined,
    badge: asString(src.badge) || undefined,
    accent: Boolean(src.accent),
    enabled: src.enabled === false ? false : true,
    external: Boolean(src.external ?? to.startsWith('http')),
  }
}

function normalizeBottom(raw: unknown, index: number): NavBottomLinkPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = asString(src.id, `bottom-${index + 1}`) || `bottom-${index + 1}`
  const badge = asString(src.badge)
  return {
    id,
    label: asString(src.label, id),
    icon: asString(src.icon, 'circle'),
    iconActive: asString(src.iconActive) || undefined,
    to: asString(src.to) || undefined,
    badge: badge === 'cart' ? 'cart' : badge || undefined,
    enabled: src.enabled === false ? false : true,
  }
}

export function normalizeNavigationSettings(raw: unknown): NavigationSettingsPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const quick = Array.isArray(src.quickLinks) ? src.quickLinks : null
  const bottom = Array.isArray(src.bottomLinks) ? src.bottomLinks : null

  return {
    quickLinks: (quick?.length ? quick : defaultNavigationSettings.quickLinks).map(normalizeQuick),
    bottomLinks: (bottom?.length ? bottom : defaultNavigationSettings.bottomLinks).map(normalizeBottom),
  }
}

export async function loadNavigationSettings(): Promise<NavigationSettingsPayload> {
  const block = await ContentBlock.find(NAVIGATION_SETTINGS_KEY)
  if (!block?.value) return { ...defaultNavigationSettings }
  return normalizeNavigationSettings(block.value)
}

export async function saveNavigationSettings(payload: unknown) {
  const next = normalizeNavigationSettings(payload)
  await ContentBlock.updateOrCreate(
    { key: NAVIGATION_SETTINGS_KEY },
    { key: NAVIGATION_SETTINGS_KEY, value: next },
  )
  return next
}

/** Public storefront payload — only enabled links. */
export async function loadPublicNavigation() {
  const all = await loadNavigationSettings()
  return {
    quickLinks: all.quickLinks.filter((l) => l.enabled),
    bottomLinks: all.bottomLinks.filter((l) => l.enabled),
  }
}
