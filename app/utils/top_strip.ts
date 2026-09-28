import ContentBlock from '#models/content_block'

export const TOP_STRIP_KEY = 'topStrip'
export const TOP_STRIP_MAX_LINKS = 6

export type TopStripLink = {
  id: string
  label: string
  to: string
}

export type TopStripSettings = {
  enabled: boolean
  supportLabel: string
  supportPhone: string
  highlight: string
  links: TopStripLink[]
}

export const defaultTopStripSettings: TopStripSettings = {
  enabled: true,
  supportLabel: 'پشتیبانی ۲۴ ساعته:',
  supportPhone: '۰۲۱-۹۱۰۰۰۰۰۰',
  highlight: 'ارسال رایگان سفارش‌های بالای ۵۰۰ هزار تومان',
  links: [
    { id: 'orders', label: 'پیگیری سفارش', to: '/account/orders' },
    { id: 'app', label: 'اپلیکیشن موبایل', to: '' },
  ],
}

function asString(value: unknown, fallback = '') {
  if (value == null) return fallback
  return String(value)
}

export function cleanTopStripHref(value: unknown) {
  const to = asString(value).trim()
  if (!to) return ''
  if (to.startsWith('/') || /^https?:\/\//i.test(to)) return to
  return ''
}

function normalizeLink(raw: unknown, index: number): TopStripLink | null {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const label = asString(src.label).trim()
  if (!label) return null
  const id = asString(src.id, `link-${index + 1}`).trim() || `link-${index + 1}`
  return {
    id: id.slice(0, 80),
    label: label.slice(0, 80),
    to: cleanTopStripHref(src.to),
  }
}

export function normalizeTopStripSettings(raw: unknown): TopStripSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const linksRaw = Array.isArray(src.links) ? src.links : defaultTopStripSettings.links
  const links = linksRaw
    .map(normalizeLink)
    .filter((item): item is TopStripLink => item != null)
    .slice(0, TOP_STRIP_MAX_LINKS)

  return {
    enabled: src.enabled === false ? false : true,
    supportLabel: asString(src.supportLabel, defaultTopStripSettings.supportLabel).trim().slice(0, 80),
    supportPhone: asString(src.supportPhone, defaultTopStripSettings.supportPhone).trim().slice(0, 40),
    highlight: asString(src.highlight, defaultTopStripSettings.highlight).trim().slice(0, 160),
    links,
  }
}

export function topStripHasContent(settings: TopStripSettings) {
  return Boolean(
    settings.supportLabel
    || settings.supportPhone
    || settings.highlight
    || settings.links.length,
  )
}

export async function loadTopStripSettings(): Promise<TopStripSettings> {
  const block = await ContentBlock.find(TOP_STRIP_KEY)
  if (!block?.value) return { ...defaultTopStripSettings, links: defaultTopStripSettings.links.map((l) => ({ ...l })) }
  return normalizeTopStripSettings(block.value)
}

export async function saveTopStripSettings(payload: unknown) {
  const next = normalizeTopStripSettings(payload)
  await ContentBlock.updateOrCreate(
    { key: TOP_STRIP_KEY },
    { key: TOP_STRIP_KEY, value: next },
  )
  return next
}
