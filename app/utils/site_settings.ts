import ContentBlock from '#models/content_block'
import User from '#models/user'
import { loadFooterPayload, saveFooterPayload, type FooterPayload } from '#utils/footer'

export const SITE_SETTINGS_KEY = 'siteSettings'

export type SiteSettings = {
  name: string
  slug: string
  phone: string
  email: string
  city: string
  about: string
  rating: number
  reviewCount: number
  joinDate: string
}

export const defaultSiteSettings: SiteSettings = {
  name: 'دیجی‌شاپ',
  slug: 'digishop',
  /** Same as seeded admin login phone */
  phone: '09121234567',
  email: 'info@digishop.ir',
  city: 'تهران',
  about:
    'دیجی‌شاپ بزرگ‌ترین فروشگاه اینترنتی محصولات دیجیتال با گارانتی اصالت کالا و ارسال سریع به سراسر ایران.',
  rating: 0,
  reviewCount: 0,
  joinDate: '',
}

export class SiteSettingsError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message)
  }
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function phoneHref(phone: string) {
  const digits = digitsOnly(phone)
  return digits ? `tel:${digits}` : `tel:${phone}`
}

function emailHref(email: string) {
  return email.startsWith('mailto:') ? email : `mailto:${email}`
}

export async function resolveAdminUser() {
  return User.query().where('role', 'admin').orderBy('id', 'asc').first()
}

export async function resolveAdminPhone(): Promise<string | null> {
  const admin = await resolveAdminUser()
  return admin?.phone ?? null
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  const row = await ContentBlock.find(SITE_SETTINGS_KEY)
  const value = (row?.value as Partial<SiteSettings> | null) ?? null
  const adminPhone = await resolveAdminPhone()
  return {
    ...defaultSiteSettings,
    ...(value && typeof value === 'object' ? value : {}),
    // Contact phone always mirrors admin login phone
    phone: adminPhone || value?.phone || defaultSiteSettings.phone,
  }
}

async function syncAdminLoginPhone(phone: string) {
  const normalized = digitsOnly(phone)
  if (!/^09\d{9}$/.test(normalized)) {
    throw new SiteSettingsError('phone', 'شماره تماس باید همان موبایل ورود ادمین باشد (۰۹xxxxxxxxx)')
  }

  const admin = await resolveAdminUser()
  if (!admin) {
    throw new SiteSettingsError('phone', 'حساب ادمین یافت نشد')
  }

  if (admin.phone === normalized) return

  const clash = await User.query().where('phone', normalized).whereNot('id', admin.id).first()
  if (clash) {
    throw new SiteSettingsError('phone', 'این شماره قبلاً برای کاربر دیگری ثبت شده است')
  }

  admin.phone = normalized
  await admin.save()
}

export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
  options?: { syncFooter?: boolean }
): Promise<SiteSettings> {
  const prev = await loadSiteSettings()
  const nextPhone = String(patch.phone ?? prev.phone).trim()

  await syncAdminLoginPhone(nextPhone)

  const next: SiteSettings = {
    ...prev,
    ...patch,
    name: String(patch.name ?? prev.name).trim() || defaultSiteSettings.name,
    slug: String(patch.slug ?? prev.slug).trim() || defaultSiteSettings.slug,
    phone: digitsOnly(nextPhone),
    email: String(patch.email ?? prev.email).trim(),
    city: String(patch.city ?? prev.city).trim(),
    about: String(patch.about ?? prev.about).trim(),
    rating: Number(patch.rating ?? prev.rating) || 0,
    reviewCount: Number(patch.reviewCount ?? prev.reviewCount) || 0,
    joinDate: String(patch.joinDate ?? prev.joinDate ?? ''),
  }

  await ContentBlock.updateOrCreate(
    { key: SITE_SETTINGS_KEY },
    { key: SITE_SETTINGS_KEY, value: next }
  )

  if (options?.syncFooter !== false) {
    await syncFooterFromSiteSettings(next)
  }

  return next
}

/** Footer payload with site identity (admin phone / about / email) overlaid. */
export async function loadFooterWithSiteOverlay(): Promise<FooterPayload> {
  const [footer, site] = await Promise.all([loadFooterPayload(), loadSiteSettings()])
  const phones = Array.isArray(footer.contact?.phones) ? [...footer.contact.phones] : []
  const primaryPhone = site.phone
    ? { label: site.phone, href: phoneHref(site.phone) }
    : null
  const rest = primaryPhone
    ? phones.filter((p) => digitsOnly(p.href || p.label) !== digitsOnly(site.phone))
    : phones

  return {
    ...footer,
    about: site.about || footer.about,
    contact: {
      phones: primaryPhone ? [primaryPhone, ...rest] : rest,
      email: site.email
        ? { label: site.email, href: emailHref(site.email) }
        : footer.contact?.email ?? { label: '', href: '' },
    },
  }
}

/** Keep footer about + primary contact aligned with site identity. */
export async function syncFooterFromSiteSettings(site?: SiteSettings) {
  const settings = site ?? (await loadSiteSettings())
  const footer = await loadFooterPayload()
  const phones = Array.isArray(footer.contact?.phones) ? [...footer.contact.phones] : []
  const primary = {
    label: settings.phone,
    href: phoneHref(settings.phone),
  }
  const rest = phones.filter((p) => digitsOnly(p.href || p.label) !== digitsOnly(settings.phone))
  const nextContact: FooterPayload['contact'] = {
    phones: settings.phone ? [primary, ...rest] : rest,
    email: settings.email
      ? { label: settings.email, href: emailHref(settings.email) }
      : footer.contact?.email ?? { label: '', href: '' },
  }

  await saveFooterPayload({
    ...footer,
    about: settings.about || footer.about,
    contact: nextContact,
  })
}

/** When footer about/contact are edited, mirror into site settings (+ admin phone). */
export async function syncSiteSettingsFromFooter(footer: FooterPayload) {
  const prev = await loadSiteSettings()
  const primaryPhone = footer.contact?.phones?.[0]
  const phone = primaryPhone?.label || digitsOnly(primaryPhone?.href || '') || prev.phone
  const email = footer.contact?.email?.label || prev.email

  await saveSiteSettings(
    {
      about: footer.about || prev.about,
      phone: phone || prev.phone,
      email: email || prev.email,
    },
    { syncFooter: false }
  )
}
