import User from '#models/user'
import AdminRole from '#models/admin_role'
import Product from '#models/product'
import SellerOrder from '#models/seller_order'
import BlogPost from '#models/blog_post'
import StaticPage from '#models/static_page'
import MediaAsset from '#models/media_asset'
import Banner from '#models/banner'
import AuditLog from '#models/audit_log'
import { ensureSystemAdminRoles } from '#utils/seller_admins'
import { SYSTEM_ROLE_META } from '#utils/admin_rbac'
import env from '#start/env'

function num(row: any) {
  return Number(row?.$extras?.total ?? row?.total ?? 0)
}

function permissionCatalogSize() {
  const set = new Set<string>()
  for (const meta of Object.values(SYSTEM_ROLE_META)) {
    for (const p of meta.permissions) {
      if (p !== '*') set.add(p)
    }
  }
  return set.size
}

function integrationStatus() {
  const merchant = (env.get('ZARINPAL_MERCHANT_ID') || '').trim()
  const sandbox = env.get('ZARINPAL_SANDBOX') === true
  const paymentMock = env.get('ALLOW_PAYMENT_MOCK') === true
  let zarinpal: 'live' | 'sandbox' | 'mock' | 'unconfigured' = 'unconfigured'
  let zarinpalHint = 'وضعیت از تنظیمات درگاه‌ها خوانده می‌شود'
  if (paymentMock && (!merchant || merchant.startsWith('00000000'))) {
    zarinpal = 'mock'
    zarinpalHint = 'حالت mock پرداخت فعال است'
  } else if (merchant) {
    zarinpal = sandbox ? 'sandbox' : 'live'
    zarinpalHint = sandbox ? 'درگاه در حالت سندباکس' : 'درگاه زنده'
  }

  const kavenegar = (env.get('KAVENEGAR_API_KEY') || '').trim()
  const otpMock = env.get('ALLOW_OTP_MOCK') === true
  let sms: 'live' | 'mock' | 'unconfigured' = 'unconfigured'
  let smsHint = ''
  if (kavenegar) {
    sms = 'live'
    smsHint = 'کاوه‌نگار پیکربندی شده'
  } else if (otpMock) {
    sms = 'mock'
    smsHint = 'OTP mock فعال است'
  }

  return [
    {
      id: 'zarinpal',
      label: 'زرین‌پال',
      status: zarinpal,
      hint: zarinpalHint,
    },
    {
      id: 'sms',
      label: 'پیامک',
      status: sms,
      hint: smsHint || 'پیکربندی نشده',
    },
    {
      id: 'email',
      label: 'ایمیل تراکنشی',
      status: 'unconfigured' as const,
      hint: 'پیکربندی نشده',
    },
  ]
}

export async function querySystemOverview() {
  await ensureSystemAdminRoles()

  const [
    adminsAll,
    adminsActive,
    rolesAll,
    productsAll,
    ordersAll,
    blogAll,
    pagesAll,
    mediaAll,
    bannersAll,
  ] = await Promise.all([
    User.query().where('role', 'admin').count('* as total').first(),
    User.query().where('role', 'admin').where('status', 'active').count('* as total').first(),
    AdminRole.query().count('* as total').first(),
    Product.query().count('* as total').first(),
    SellerOrder.query().count('* as total').first(),
    BlogPost.query().count('* as total').first(),
    StaticPage.query().count('* as total').first(),
    MediaAsset.query().count('* as total').first(),
    Banner.query().count('* as total').first(),
  ])

  let recentEvents: Array<{
    id: string
    summary: string
    actorName: string
    createdAt: string
    source: 'audit'
  }> = []
  try {
    const recentRows = await AuditLog.query().orderBy('created_at', 'desc').limit(8)
    recentEvents = recentRows.map((row) => ({
      id: row.id,
      summary: row.summary,
      actorName: row.actorName || 'سیستم',
      createdAt: row.createdAt?.toISO() ?? new Date().toISOString(),
      source: 'audit' as const,
    }))
  } catch {
    recentEvents = []
  }

  return {
    stats: {
      admins: { total: num(adminsAll), active: num(adminsActive) },
      roles: { total: num(rolesAll) },
      permissions: { total: permissionCatalogSize() },
      products: { total: num(productsAll) },
      orders: { total: num(ordersAll) },
      blog: { total: num(blogAll) },
      pages: { total: num(pagesAll) },
      media: { total: num(mediaAll) },
      banners: { total: num(bannersAll) },
    },
    integrations: integrationStatus(),
    recentEvents,
    generatedAt: new Date().toISOString(),
  }
}
