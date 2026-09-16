import env from '#start/env'

export type TechnolifeImportMode = 'preview' | 'create_only' | 'upsert'

export type TechnolifeFieldPolicy = {
  updatePrice: boolean
  updateInventory: boolean
  updateDescription: boolean
  updateImages: boolean
  updateSpecs: boolean
}

const ALLOWED_HOSTS = new Set([
  'technolife.ir',
  'www.technolife.ir',
  'technolife.com',
  'www.technolife.com',
])

function boolEnv(key: string, fallback: boolean) {
  const raw = env.get(key as never) as unknown
  if (raw === undefined || raw === null) return fallback
  if (typeof raw === 'boolean') return raw
  const s = String(raw).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(s)) return true
  if (['0', 'false', 'no', 'off'].includes(s)) return false
  return fallback
}

function numEnv(key: string, fallback: number) {
  const raw = env.get(key as never) as unknown
  if (raw === undefined || raw === null || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export const technolifeConfig = {
  get enabled() {
    return boolEnv('TECHNOLIFE_ENABLED', true)
  },
  get requestDelayMs() {
    return Math.max(0, numEnv('TECHNOLIFE_REQUEST_DELAY_MS', 1500))
  },
  get timeoutMs() {
    return Math.max(1000, numEnv('TECHNOLIFE_TIMEOUT_MS', 15000))
  },
  get maxRetries() {
    return Math.max(0, numEnv('TECHNOLIFE_MAX_RETRIES', 3))
  },
  get concurrency() {
    return Math.max(1, Math.min(1, numEnv('TECHNOLIFE_CONCURRENCY', 1)))
  },
  get maxImages() {
    return Math.max(1, numEnv('TECHNOLIFE_MAX_IMAGES', 20))
  },
  get defaultStock() {
    return Math.max(0, Math.floor(numEnv('TECHNOLIFE_DEFAULT_STOCK', 10)))
  },
  get defaultCategoryId() {
    return String(env.get('TECHNOLIFE_DEFAULT_CATEGORY_ID' as never) || 'mobile').trim() || 'mobile'
  },
  get defaultCategoryUrl() {
    return (
      String(
        env.get('TECHNOLIFE_DEFAULT_CATEGORY_URL' as never) ||
          'https://www.technolife.com/category/mobile/mobile-phone'
      ).trim() || 'https://www.technolife.com/category/mobile/mobile-phone'
    )
  },
  get maxCategoryImport() {
    return Math.max(1, Math.min(500, Math.floor(numEnv('TECHNOLIFE_MAX_CATEGORY_IMPORT', 100))))
  },
  get defaultFieldPolicy(): TechnolifeFieldPolicy {
    return {
      updatePrice: boolEnv('TECHNOLIFE_UPDATE_PRICE', false),
      updateInventory: boolEnv('TECHNOLIFE_UPDATE_INVENTORY', false),
      updateDescription: boolEnv('TECHNOLIFE_UPDATE_DESCRIPTION', true),
      updateImages: boolEnv('TECHNOLIFE_UPDATE_IMAGES', true),
      updateSpecs: boolEnv('TECHNOLIFE_UPDATE_SPECS', true),
    }
  },
  allowedHosts: ALLOWED_HOSTS,
}

export default technolifeConfig
