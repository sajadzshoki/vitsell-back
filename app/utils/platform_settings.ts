import ContentBlock from '#models/content_block'

export const PLATFORM_SETTINGS_KEY = 'platformSettings'

export type PlatformSettingsPayload = {
  defaultLocale: string
  currencyLabel: string
  dateFormatHint: string
  numberFormatHint: string
  timezone: string
  logoUrl: string
  faviconUrl: string
  defaultOgImage: string
  brandName: string
  brandDescription: string
  supportPhone: string
  salesPhone: string
  supportEmail: string
  address: string
  workingHours: string
  minOrderAmount: number
  guestCheckoutEnabled: boolean
  outOfStockBehavior: 'hide' | 'show_unavailable' | 'allow_backorder'
  taxDisplay: 'inclusive' | 'exclusive' | 'none'
  returnWindowDays: number
  cancelAllowedStatuses: string
  notifyAdminNewOrder: boolean
  notifyAdminFailedPayment: boolean
  notifyAdminLowStock: boolean
  notifyAdminReturn: boolean
  notifyAdminRefund: boolean
  notifyCustomerOrderStatus: boolean
  notifyCustomerPayment: boolean
  notifyCustomerShipping: boolean
  notifyCustomerMarketing: boolean
  freeShippingThreshold: number
  deliveryEstimateText: string
  shippingMethodsVisible: boolean
}

export const defaultPlatformSettings: PlatformSettingsPayload = {
  defaultLocale: 'fa',
  currencyLabel: 'تومان',
  dateFormatHint: 'YYYY/MM/DD',
  numberFormatHint: 'fa-IR',
  timezone: 'Asia/Tehran',
  logoUrl: '',
  faviconUrl: '',
  defaultOgImage: '',
  brandName: '',
  brandDescription: '',
  supportPhone: '',
  salesPhone: '',
  supportEmail: '',
  address: '',
  workingHours: 'شنبه تا پنج‌شنبه ۹ تا ۱۸',
  minOrderAmount: 0,
  guestCheckoutEnabled: true,
  outOfStockBehavior: 'show_unavailable',
  taxDisplay: 'inclusive',
  returnWindowDays: 7,
  cancelAllowedStatuses: 'new,packing',
  notifyAdminNewOrder: true,
  notifyAdminFailedPayment: true,
  notifyAdminLowStock: true,
  notifyAdminReturn: true,
  notifyAdminRefund: true,
  notifyCustomerOrderStatus: true,
  notifyCustomerPayment: true,
  notifyCustomerShipping: true,
  notifyCustomerMarketing: false,
  freeShippingThreshold: 0,
  deliveryEstimateText: '۱ تا ۳ روز کاری',
  shippingMethodsVisible: true,
}

function asString(value: unknown, fallback: string) {
  if (value == null) return fallback
  return String(value)
}

function asNumber(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asBool(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

export function normalizePlatformSettings(raw: unknown): PlatformSettingsPayload {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const stock = String(src.outOfStockBehavior || defaultPlatformSettings.outOfStockBehavior)
  const tax = String(src.taxDisplay || defaultPlatformSettings.taxDisplay)

  return {
    defaultLocale: asString(src.defaultLocale, defaultPlatformSettings.defaultLocale),
    currencyLabel: asString(src.currencyLabel, defaultPlatformSettings.currencyLabel),
    dateFormatHint: asString(src.dateFormatHint, defaultPlatformSettings.dateFormatHint),
    numberFormatHint: asString(src.numberFormatHint, defaultPlatformSettings.numberFormatHint),
    timezone: asString(src.timezone, defaultPlatformSettings.timezone),
    logoUrl: asString(src.logoUrl, ''),
    faviconUrl: asString(src.faviconUrl, ''),
    defaultOgImage: asString(src.defaultOgImage, ''),
    brandName: asString(src.brandName, ''),
    brandDescription: asString(src.brandDescription, ''),
    supportPhone: asString(src.supportPhone, ''),
    salesPhone: asString(src.salesPhone, ''),
    supportEmail: asString(src.supportEmail, ''),
    address: asString(src.address, ''),
    workingHours: asString(src.workingHours, defaultPlatformSettings.workingHours),
    minOrderAmount: Math.max(0, asNumber(src.minOrderAmount, 0)),
    guestCheckoutEnabled: asBool(src.guestCheckoutEnabled, true),
    outOfStockBehavior:
      stock === 'hide' || stock === 'allow_backorder' || stock === 'show_unavailable'
        ? stock
        : 'show_unavailable',
    taxDisplay:
      tax === 'inclusive' || tax === 'exclusive' || tax === 'none' ? tax : 'inclusive',
    returnWindowDays: Math.max(0, Math.round(asNumber(src.returnWindowDays, 7))),
    cancelAllowedStatuses: asString(src.cancelAllowedStatuses, defaultPlatformSettings.cancelAllowedStatuses),
    notifyAdminNewOrder: asBool(src.notifyAdminNewOrder, true),
    notifyAdminFailedPayment: asBool(src.notifyAdminFailedPayment, true),
    notifyAdminLowStock: asBool(src.notifyAdminLowStock, true),
    notifyAdminReturn: asBool(src.notifyAdminReturn, true),
    notifyAdminRefund: asBool(src.notifyAdminRefund, true),
    notifyCustomerOrderStatus: asBool(src.notifyCustomerOrderStatus, true),
    notifyCustomerPayment: asBool(src.notifyCustomerPayment, true),
    notifyCustomerShipping: asBool(src.notifyCustomerShipping, true),
    notifyCustomerMarketing: asBool(src.notifyCustomerMarketing, false),
    freeShippingThreshold: Math.max(0, asNumber(src.freeShippingThreshold, 0)),
    deliveryEstimateText: asString(
      src.deliveryEstimateText,
      defaultPlatformSettings.deliveryEstimateText,
    ),
    shippingMethodsVisible: asBool(src.shippingMethodsVisible, true),
  }
}

export async function loadPlatformSettings(): Promise<PlatformSettingsPayload> {
  const block = await ContentBlock.find(PLATFORM_SETTINGS_KEY)
  return normalizePlatformSettings(block?.value)
}

export async function savePlatformSettings(payload: unknown) {
  const next = normalizePlatformSettings(payload)
  await ContentBlock.updateOrCreate(
    { key: PLATFORM_SETTINGS_KEY },
    { key: PLATFORM_SETTINGS_KEY, value: next },
  )
  return next
}
