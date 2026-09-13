/** System RBAC defaults — keep in sync with vitsell FE seller-permissions / seller-roles */

export type AdminRoleStatus = 'active' | 'inactive'
export type AdminStaffStatus = 'active' | 'inactive' | 'suspended'

export const SYSTEM_ROLE_META: Record<
  string,
  { name: string; description: string; permissions: string[] }
> = {
  SUPER_ADMIN: {
    name: 'سوپر ادمین',
    description: 'دسترسی کامل به تمام بخش‌های پنل مدیریت',
    permissions: ['*'],
  },
  ADMIN: {
    name: 'ادمین',
    description: 'دسترسی گسترده بدون مدیریت نقش‌ها و کاربران ادمین',
    permissions: [
      'dashboard.view', 'analytics.view',
      'products.view', 'products.create', 'products.update', 'products.delete',
      'categories.view', 'categories.create', 'categories.update', 'categories.delete',
      'brands.view', 'brands.create', 'brands.update', 'brands.delete',
      'attributes.view', 'attributes.create', 'attributes.update', 'attributes.delete',
      'inventory.view', 'inventory.update',
      'warehouses.view', 'warehouses.create', 'warehouses.update', 'warehouses.delete',
      'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.delete', 'orders.refund', 'orders.export',
      'returns.view', 'returns.manage', 'shipping.view', 'shipping.manage',
      'customers.view', 'customers.create', 'customers.update', 'customers.export', 'customers.block',
      'refunds.view', 'refunds.create', 'refunds.manage',
      'reviews.view', 'reviews.moderate', 'reviews.delete',
      'questions.view', 'questions.answer', 'questions.delete',
      'marketing.view', 'marketing.manage',
      'banners.view', 'banners.create', 'banners.update', 'banners.delete',
      'deals.view', 'deals.create', 'deals.update', 'deals.delete',
      'discounts.view', 'discounts.create', 'discounts.update', 'discounts.delete',
      'coupons.view', 'coupons.create', 'coupons.update', 'coupons.delete',
      'campaigns.view', 'campaigns.create', 'campaigns.update', 'campaigns.delete',
      'promotions.view', 'promotions.create', 'promotions.update', 'promotions.delete',
      'notifications.view', 'notifications.create', 'notifications.update', 'notifications.delete', 'notifications.send',
      'blog.view', 'blog.create', 'blog.update', 'blog.delete', 'blog.publish',
      'pages.view', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
      'about.view', 'about.update', 'media.view', 'media.manage',
      'footer.view', 'footer.update', 'seo.view', 'seo.update',
      'finance.view', 'finance.manage',
      'transactions.view', 'transactions.export',
      'payments.view', 'payments.manage',
      'settlements.view', 'settlements.manage',
      'finance_reports.view', 'finance_reports.export',
      'financial_adjustments.create',
      'financial_reconciliation.view', 'financial_reconciliation.manage',
      'admins.view', 'roles.view', 'permissions.view',
      'audit.view', 'activity.view',
      'settings.view', 'settings.update',
      'system.view', 'system.manage',
      'navigation.view', 'navigation.update',
      'mega_menu.view', 'mega_menu.create', 'mega_menu.update', 'mega_menu.delete',
      'imports.view', 'imports.create', 'imports.manage',
      'exports.view', 'exports.create',
    ],
  },
  PRODUCT_MANAGER: {
    name: 'مدیر محصول',
    description: 'مدیریت کاتالوگ، موجودی و ویژگی‌ها',
    permissions: [
      'dashboard.view', 'analytics.view',
      'products.view', 'products.create', 'products.update', 'products.delete',
      'categories.view', 'categories.create', 'categories.update', 'categories.delete',
      'brands.view', 'brands.create', 'brands.update', 'brands.delete',
      'attributes.view', 'attributes.create', 'attributes.update', 'attributes.delete',
      'inventory.view', 'inventory.update',
      'warehouses.view', 'warehouses.create', 'warehouses.update', 'warehouses.delete',
      'media.view', 'media.manage', 'seo.view', 'seo.update',
      'mega_menu.view', 'mega_menu.create', 'mega_menu.update', 'mega_menu.delete',
    ],
  },
  ORDER_MANAGER: {
    name: 'مدیر سفارش',
    description: 'مدیریت سفارش‌ها، ارسال و مرجوعی',
    permissions: [
      'dashboard.view',
      'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.delete', 'orders.refund', 'orders.export',
      'returns.view', 'returns.manage', 'shipping.view', 'shipping.manage',
      'refunds.view', 'refunds.create', 'refunds.manage',
      'customers.view', 'customers.create', 'customers.update', 'customers.export', 'customers.block',
      'products.view', 'inventory.view',
    ],
  },
  CONTENT_MANAGER: {
    name: 'مدیر محتوا',
    description: 'وبلاگ، صفحات، درباره ما و رسانه',
    permissions: [
      'dashboard.view',
      'blog.view', 'blog.create', 'blog.update', 'blog.delete', 'blog.publish',
      'blog_categories.view', 'blog_categories.create', 'blog_categories.update', 'blog_categories.delete',
      'blog_tags.view', 'blog_tags.create', 'blog_tags.update', 'blog_tags.delete',
      'pages.view', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
      'about.view', 'about.update', 'media.view', 'media.manage',
      'footer.view', 'footer.update',
      'banners.view', 'banners.create', 'banners.update', 'banners.delete',
      'seo.view', 'seo.update',
      'mega_menu.view', 'mega_menu.create', 'mega_menu.update', 'mega_menu.delete',
      'navigation.view', 'navigation.update',
    ],
  },
  MARKETING_MANAGER: {
    name: 'مدیر بازاریابی',
    description: 'بنر، شگفت‌انگیز، پروموشن و اعلان',
    permissions: [
      'dashboard.view', 'analytics.view',
      'marketing.view', 'marketing.manage',
      'banners.view', 'banners.create', 'banners.update', 'banners.delete',
      'deals.view', 'deals.create', 'deals.update', 'deals.delete',
      'discounts.view', 'discounts.create', 'discounts.update', 'discounts.delete',
      'coupons.view', 'coupons.create', 'coupons.update', 'coupons.delete',
      'campaigns.view', 'campaigns.create', 'campaigns.update', 'campaigns.delete',
      'promotions.view', 'promotions.create', 'promotions.update', 'promotions.delete',
      'notifications.view', 'notifications.create', 'notifications.update', 'notifications.delete', 'notifications.send',
      'media.view', 'media.manage',
      'products.view', 'categories.view', 'brands.view',
    ],
  },
  FINANCE_MANAGER: {
    name: 'مدیر مالی',
    description: 'مالی، تسویه و گزارش‌های مرتبط',
    permissions: [
      'dashboard.view', 'analytics.view',
      'finance.view', 'finance.manage',
      'transactions.view', 'transactions.export',
      'payments.view', 'payments.manage',
      'settlements.view', 'settlements.manage',
      'finance_reports.view', 'finance_reports.export',
      'financial_adjustments.create',
      'financial_reconciliation.view', 'financial_reconciliation.manage',
      'refunds.view', 'refunds.create', 'refunds.manage',
      'orders.view', 'orders.export',
      'customers.view',
    ],
  },
  SUPPORT_MANAGER: {
    name: 'مدیر پشتیبانی',
    description: 'مشتریان، نظرات، پرسش‌ها و پشتیبانی سفارش',
    permissions: [
      'dashboard.view',
      'orders.view', 'orders.export', 'orders.update',
      'returns.view', 'returns.manage',
      'refunds.view',
      'customers.view', 'customers.create', 'customers.update', 'customers.export',
      'reviews.view', 'reviews.moderate', 'reviews.delete',
      'questions.view', 'questions.answer', 'questions.delete',
      'shipping.view',
      'products.view',
    ],
  },
  SUPPORT_AGENT: {
    name: 'پشتیبان',
    description: 'سفارش‌ها، نظرات و پرسش مشتریان (سازگاری قدیمی)',
    permissions: [
      'dashboard.view',
      'orders.view', 'orders.export',
      'returns.view',
      'refunds.view',
      'customers.view', 'customers.create', 'customers.update', 'customers.export',
      'reviews.view', 'reviews.moderate', 'reviews.delete',
      'questions.view', 'questions.answer', 'questions.delete',
      'products.view',
    ],
  },
  VIEWER: {
    name: 'بازدیدکننده',
    description: 'فقط مشاهده بخش‌های مجاز',
    permissions: [
      'dashboard.view', 'analytics.view',
      'products.view', 'categories.view', 'brands.view', 'attributes.view',
      'inventory.view', 'warehouses.view',
      'orders.view', 'returns.view', 'shipping.view', 'refunds.view',
      'customers.view', 'reviews.view', 'questions.view',
      'marketing.view', 'banners.view', 'deals.view', 'discounts.view', 'coupons.view',
      'campaigns.view', 'promotions.view', 'notifications.view',
      'blog.view', 'pages.view', 'about.view', 'media.view', 'footer.view',
      'finance.view', 'transactions.view', 'payments.view', 'settlements.view',
      'finance_reports.view', 'financial_reconciliation.view',
      'admins.view', 'roles.view', 'permissions.view', 'audit.view', 'activity.view',
      'settings.view', 'seo.view', 'system.view', 'navigation.view',
      'mega_menu.view',
      'imports.view', 'exports.view',
    ],
  },
}

export function publicRoleId(key: string) {
  return `role-${String(key || '').toLowerCase()}`
}

export function parsePublicRoleId(id: string) {
  const raw = String(id || '').trim()
  if (!raw) return null
  if (raw.startsWith('role-')) {
    return raw.slice(5).toUpperCase()
  }
  return raw.toUpperCase()
}

export function mapUserStatusToAdmin(status: string): AdminStaffStatus {
  if (status === 'blocked') return 'suspended'
  if (status === 'inactive') return 'inactive'
  return 'active'
}

export function mapAdminStatusToUser(status: AdminStaffStatus): 'active' | 'inactive' | 'blocked' {
  if (status === 'suspended') return 'blocked'
  if (status === 'inactive') return 'inactive'
  return 'active'
}

export function isAdminAccessAllowed(status: AdminStaffStatus) {
  return status === 'active'
}
