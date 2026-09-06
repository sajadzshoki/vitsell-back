import ContentBlock from '#models/content_block'

export const SEO_REDIRECTS_KEY = 'seoRedirects'

export type SeoRedirectType = 301 | 308 | 302

export type SeoRedirectPayload = {
  id: string
  source: string
  destination: string
  type: SeoRedirectType
  active: boolean
  createdAt: string
  updatedAt: string
}

function normalizePath(path: string) {
  const trimmed = String(path || '').trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1)
  }
  return withSlash
}

function asType(value: unknown): SeoRedirectType {
  const n = Number(value)
  if (n === 308 || n === 302 || n === 301) return n
  return 301
}

export function normalizeSeoRedirect(raw: unknown, index = 0): SeoRedirectPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const now = new Date().toISOString()
  const id = String(src.id || `redir-${index + 1}-${Date.now().toString(36)}`)
  return {
    id,
    source: normalizePath(String(src.source || '/')),
    destination: String(src.destination || '').trim() || '/',
    type: asType(src.type),
    active: src.active === false ? false : true,
    createdAt: src.createdAt ? String(src.createdAt) : now,
    updatedAt: src.updatedAt ? String(src.updatedAt) : now,
  }
}

export function normalizeSeoRedirects(raw: unknown): SeoRedirectPayload[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, index) => normalizeSeoRedirect(item, index))
}

export async function loadSeoRedirects(): Promise<SeoRedirectPayload[]> {
  const block = await ContentBlock.find(SEO_REDIRECTS_KEY)
  return normalizeSeoRedirects(block?.value)
}

export async function saveSeoRedirects(list: SeoRedirectPayload[]) {
  const next = normalizeSeoRedirects(list)
  await ContentBlock.updateOrCreate(
    { key: SEO_REDIRECTS_KEY },
    { key: SEO_REDIRECTS_KEY, value: next },
  )
  return next
}

export async function createSeoRedirect(input: unknown) {
  const list = await loadSeoRedirects()
  const now = new Date().toISOString()
  const item = normalizeSeoRedirect({
    ...(input && typeof input === 'object' ? input : {}),
    id: `redir-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  })
  const clash = list.find(
    (r) => r.id !== item.id && normalizePath(r.source) === item.source,
  )
  if (clash) {
    return { ok: false as const, error: 'مسیر مبدأ تکراری است', item: null }
  }
  const next = await saveSeoRedirects([...list, item])
  return { ok: true as const, error: null, item: next.find((r) => r.id === item.id)! }
}

export async function updateSeoRedirect(id: string, input: unknown) {
  const list = await loadSeoRedirects()
  const index = list.findIndex((r) => r.id === id)
  if (index === -1) {
    return { ok: false as const, error: 'not_found' as const, item: null }
  }
  const prev = list[index]!
  const item = normalizeSeoRedirect({
    ...prev,
    ...(input && typeof input === 'object' ? input : {}),
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: new Date().toISOString(),
  })
  const clash = list.find(
    (r) => r.id !== item.id && normalizePath(r.source) === item.source,
  )
  if (clash) {
    return { ok: false as const, error: 'مسیر مبدأ تکراری است', item: null }
  }
  const copy = [...list]
  copy[index] = item
  await saveSeoRedirects(copy)
  return { ok: true as const, error: null, item }
}

export async function deleteSeoRedirect(id: string) {
  const list = await loadSeoRedirects()
  if (!list.some((r) => r.id === id)) {
    return { ok: false as const, error: 'not_found' as const }
  }
  await saveSeoRedirects(list.filter((r) => r.id !== id))
  return { ok: true as const, error: null }
}
