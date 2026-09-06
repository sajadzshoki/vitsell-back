import ContentBlock from '#models/content_block'
import { loadSiteSettings } from '#utils/site_settings'
import { loadPlatformSettings } from '#utils/platform_settings'
import env from '#start/env'

export const SEO_SETTINGS_KEY = 'seoSettings'

export type SeoSettingsPayload = {
  siteName: string
  siteUrl: string
  titlePattern: string
  defaultRobots: 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow'
  defaultOgImage: string
  twitterCard: 'summary' | 'summary_large_image'
  updatedAt: string | null
}

export const defaultSeoSettings: SeoSettingsPayload = {
  siteName: 'دیجی‌شاپ',
  siteUrl: 'https://digishop.local',
  titlePattern: '{title} | {site}',
  defaultRobots: 'index,follow',
  defaultOgImage: '',
  twitterCard: 'summary_large_image',
  updatedAt: null,
}

function asString(value: unknown, fallback: string) {
  if (value == null) return fallback
  return String(value)
}

export function normalizeSeoSettings(raw: unknown): SeoSettingsPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const robots = String(src.defaultRobots || defaultSeoSettings.defaultRobots)
  const card = String(src.twitterCard || defaultSeoSettings.twitterCard)

  return {
    siteName: asString(src.siteName, defaultSeoSettings.siteName).trim() || defaultSeoSettings.siteName,
    siteUrl: asString(src.siteUrl, defaultSeoSettings.siteUrl).trim().replace(/\/+$/, '')
      || defaultSeoSettings.siteUrl,
    titlePattern: asString(src.titlePattern, defaultSeoSettings.titlePattern).trim()
      || defaultSeoSettings.titlePattern,
    defaultRobots:
      robots === 'noindex,follow'
      || robots === 'index,nofollow'
      || robots === 'noindex,nofollow'
      || robots === 'index,follow'
        ? robots
        : 'index,follow',
    defaultOgImage: asString(src.defaultOgImage, ''),
    twitterCard: card === 'summary' ? 'summary' : 'summary_large_image',
    updatedAt: src.updatedAt ? String(src.updatedAt) : null,
  }
}

export async function loadSeoSettings(): Promise<SeoSettingsPayload> {
  const block = await ContentBlock.find(SEO_SETTINGS_KEY)
  const base = normalizeSeoSettings(block?.value)
  if (block?.value) return base

  const [site, platform] = await Promise.all([loadSiteSettings(), loadPlatformSettings()])
  const appUrl = String(env.get('FRONTEND_URL') || defaultSeoSettings.siteUrl).replace(/\/$/, '')
  return normalizeSeoSettings({
    ...base,
    siteName: site.name || base.siteName,
    siteUrl: appUrl || base.siteUrl,
    defaultOgImage: platform.defaultOgImage || base.defaultOgImage,
  })
}

export async function saveSeoSettings(payload: unknown) {
  const next = normalizeSeoSettings({
    ...(payload && typeof payload === 'object' ? payload : {}),
    updatedAt: new Date().toISOString(),
  })
  await ContentBlock.updateOrCreate(
    { key: SEO_SETTINGS_KEY },
    { key: SEO_SETTINGS_KEY, value: next },
  )
  return next
}
