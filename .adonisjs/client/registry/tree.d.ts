/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  upload: {
    show: typeof routes['upload.show']
    store: typeof routes['upload.store']
  }
  auth: {
    requestOtp: typeof routes['auth.request_otp']
    verifyOtp: typeof routes['auth.verify_otp']
    checkPhone: typeof routes['auth.check_phone']
    loginWithPassword: typeof routes['auth.login_with_password']
    resetPassword: typeof routes['auth.reset_password']
    adminCheckPhone: typeof routes['auth.admin_check_phone']
    adminLogin: typeof routes['auth.admin_login']
    me: typeof routes['auth.me']
    logout: typeof routes['auth.logout']
  }
  categories: {
    index: typeof routes['categories.index']
    show: typeof routes['categories.show']
    pageMeta: typeof routes['categories.page_meta']
    adminIndex: typeof routes['categories.admin_index']
    bulkDestroy: typeof routes['categories.bulk_destroy']
    specKeys: typeof routes['categories.spec_keys']
    adminShow: typeof routes['categories.admin_show']
    store: typeof routes['categories.store']
    update: typeof routes['categories.update']
    destroy: typeof routes['categories.destroy']
  }
  products: {
    index: typeof routes['products.index']
    facets: typeof routes['products.facets']
    show: typeof routes['products.show']
    reviews: typeof routes['products.reviews']
    storeReview: typeof routes['products.store_review']
    questions: typeof routes['products.questions']
    storeQuestion: typeof routes['products.store_question']
  }
  content: {
    home: typeof routes['content.home']
    site: typeof routes['content.site']
    about: typeof routes['content.about']
    locations: typeof routes['content.locations']
    compareTemplates: typeof routes['content.compare_templates']
    footer: typeof routes['content.footer']
    navigation: typeof routes['content.navigation']
    seo: typeof routes['content.seo']
    seoRedirects: typeof routes['content.seo_redirects']
    discountCodes: typeof routes['content.discount_codes']
    blogIndex: typeof routes['content.blog_index']
    blogShow: typeof routes['content.blog_show']
    staticPage: typeof routes['content.static_page']
  }
  activity: {
    recommendations: typeof routes['activity.recommendations']
    store: typeof routes['activity.store']
    sync: typeof routes['activity.sync']
  }
  megaMenu: {
    index: typeof routes['mega_menu.index']
    resolve: typeof routes['mega_menu.resolve']
  }
  checkout: {
    zarinpalCallback: typeof routes['checkout.zarinpal_callback']
    place: typeof routes['checkout.place']
  }
  wallet: {
    zarinpalCallback: typeof routes['wallet.zarinpal_callback']
    show: typeof routes['wallet.show']
    topUp: typeof routes['wallet.top_up']
    withdraw: typeof routes['wallet.withdraw']
  }
  cart: {
    index: typeof routes['cart.index']
    store: typeof routes['cart.store']
    update: typeof routes['cart.update']
    destroy: typeof routes['cart.destroy']
    clear: typeof routes['cart.clear']
  }
  wishlist: {
    index: typeof routes['wishlist.index']
    store: typeof routes['wishlist.store']
    destroy: typeof routes['wishlist.destroy']
  }
  account: {
    showProfile: typeof routes['account.show_profile']
    updateProfile: typeof routes['account.update_profile']
    setPassword: typeof routes['account.set_password']
    addresses: typeof routes['account.addresses']
    storeAddress: typeof routes['account.store_address']
    updateAddress: typeof routes['account.update_address']
    destroyAddress: typeof routes['account.destroy_address']
    orders: typeof routes['account.orders']
    showOrder: typeof routes['account.show_order']
    reviews: typeof routes['account.reviews']
  }
  notifications: {
    index: typeof routes['notifications.index']
    markRead: typeof routes['notifications.mark_read']
    markAllRead: typeof routes['notifications.mark_all_read']
  }
  seller: {
    shop: typeof routes['seller.shop']
    updateShop: typeof routes['seller.update_shop']
    footer: typeof routes['seller.footer']
    updateFooter: typeof routes['seller.update_footer']
    listings: typeof routes['seller.listings']
    bulkDestroyListings: typeof routes['seller.bulk_destroy_listings']
    showListing: typeof routes['seller.show_listing']
    storeListing: typeof routes['seller.store_listing']
    updateListing: typeof routes['seller.update_listing']
    destroyListing: typeof routes['seller.destroy_listing']
    orders: typeof routes['seller.orders']
    showOrder: typeof routes['seller.show_order']
    updateOrderStatus: typeof routes['seller.update_order_status']
    updateOrderTracking: typeof routes['seller.update_order_tracking']
    addOrderNote: typeof routes['seller.add_order_note']
    createOrderRefund: typeof routes['seller.create_order_refund']
    destroyOrder: typeof routes['seller.destroy_order']
    payouts: typeof routes['seller.payouts']
    storePayout: typeof routes['seller.store_payout']
    sales: typeof routes['seller.sales']
  }
  sellerReviews: {
    index: typeof routes['seller_reviews.index']
    bulkModeration: typeof routes['seller_reviews.bulk_moderation']
    show: typeof routes['seller_reviews.show']
    update: typeof routes['seller_reviews.update']
    reply: typeof routes['seller_reviews.reply']
    setModeration: typeof routes['seller_reviews.set_moderation']
  }
  sellerQuestions: {
    index: typeof routes['seller_questions.index']
    show: typeof routes['seller_questions.show']
    update: typeof routes['seller_questions.update']
    reply: typeof routes['seller_questions.reply']
    clearAnswer: typeof routes['seller_questions.clear_answer']
    setVerified: typeof routes['seller_questions.set_verified']
    destroy: typeof routes['seller_questions.destroy']
  }
  sellerTransactions: {
    index: typeof routes['seller_transactions.index']
    show: typeof routes['seller_transactions.show']
  }
  sellerPayments: {
    index: typeof routes['seller_payments.index']
    show: typeof routes['seller_payments.show']
  }
  sellerSettlements: {
    index: typeof routes['seller_settlements.index']
    show: typeof routes['seller_settlements.show']
    store: typeof routes['seller_settlements.store']
    setStatus: typeof routes['seller_settlements.set_status']
  }
  sellerReconciliation: {
    index: typeof routes['seller_reconciliation.index']
    resolve: typeof routes['seller_reconciliation.resolve']
    unresolve: typeof routes['seller_reconciliation.unresolve']
  }
  sellerAdjustments: {
    index: typeof routes['seller_adjustments.index']
    store: typeof routes['seller_adjustments.store']
  }
  sellerReports: {
    index: typeof routes['seller_reports.index']
  }
  deals: {
    index: typeof routes['deals.index']
    bulkStore: typeof routes['deals.bulk_store']
    show: typeof routes['deals.show']
    store: typeof routes['deals.store']
    update: typeof routes['deals.update']
    setActive: typeof routes['deals.set_active']
    destroy: typeof routes['deals.destroy']
  }
  discountCodes: {
    index: typeof routes['discount_codes.index']
    show: typeof routes['discount_codes.show']
    store: typeof routes['discount_codes.store']
    update: typeof routes['discount_codes.update']
    setActive: typeof routes['discount_codes.set_active']
    destroy: typeof routes['discount_codes.destroy']
  }
  contentPromos: {
    index: typeof routes['content_promos.index']
    show: typeof routes['content_promos.show']
    store: typeof routes['content_promos.store']
    update: typeof routes['content_promos.update']
    setActive: typeof routes['content_promos.set_active']
    destroy: typeof routes['content_promos.destroy']
  }
  sellerNotifications: {
    index: typeof routes['seller_notifications.index']
    show: typeof routes['seller_notifications.show']
    users: typeof routes['seller_notifications.users']
    preview: typeof routes['seller_notifications.preview']
    store: typeof routes['seller_notifications.store']
    cancel: typeof routes['seller_notifications.cancel']
    destroy: typeof routes['seller_notifications.destroy']
  }
  sellerBlog: {
    index: typeof routes['seller_blog.index']
    show: typeof routes['seller_blog.show']
    store: typeof routes['seller_blog.store']
    update: typeof routes['seller_blog.update']
    setStatus: typeof routes['seller_blog.set_status']
    destroy: typeof routes['seller_blog.destroy']
  }
  sellerPages: {
    index: typeof routes['seller_pages.index']
    show: typeof routes['seller_pages.show']
    store: typeof routes['seller_pages.store']
    update: typeof routes['seller_pages.update']
    setStatus: typeof routes['seller_pages.set_status']
    destroy: typeof routes['seller_pages.destroy']
  }
  sellerAbout: {
    show: typeof routes['seller_about.show']
    update: typeof routes['seller_about.update']
  }
  sellerMedia: {
    index: typeof routes['seller_media.index']
    store: typeof routes['seller_media.store']
    register: typeof routes['seller_media.register']
    bulkDestroy: typeof routes['seller_media.bulk_destroy']
    show: typeof routes['seller_media.show']
    update: typeof routes['seller_media.update']
    destroy: typeof routes['seller_media.destroy']
  }
  sellerAdmins: {
    index: typeof routes['seller_admins.index']
    store: typeof routes['seller_admins.store']
    show: typeof routes['seller_admins.show']
    update: typeof routes['seller_admins.update']
    setStatus: typeof routes['seller_admins.set_status']
    destroy: typeof routes['seller_admins.destroy']
  }
  sellerRoles: {
    index: typeof routes['seller_roles.index']
    store: typeof routes['seller_roles.store']
    permissions: typeof routes['seller_roles.permissions']
    show: typeof routes['seller_roles.show']
    update: typeof routes['seller_roles.update']
    destroy: typeof routes['seller_roles.destroy']
  }
  sellerSystem: {
    summary: typeof routes['seller_system.summary']
  }
  sellerAudit: {
    index: typeof routes['seller_audit.index']
    store: typeof routes['seller_audit.store']
  }
  sellerSettings: {
    show: typeof routes['seller_settings.show']
    update: typeof routes['seller_settings.update']
  }
  sellerSeo: {
    show: typeof routes['seller_seo.show']
    update: typeof routes['seller_seo.update']
    redirectsIndex: typeof routes['seller_seo.redirects_index']
    redirectsStore: typeof routes['seller_seo.redirects_store']
    redirectsUpdate: typeof routes['seller_seo.redirects_update']
    redirectsDestroy: typeof routes['seller_seo.redirects_destroy']
  }
  sellerNavigation: {
    show: typeof routes['seller_navigation.show']
    update: typeof routes['seller_navigation.update']
  }
  sellerMegaMenus: {
    index: typeof routes['seller_mega_menus.index']
    reorder: typeof routes['seller_mega_menus.reorder']
    show: typeof routes['seller_mega_menus.show']
    store: typeof routes['seller_mega_menus.store']
    update: typeof routes['seller_mega_menus.update']
    setStatus: typeof routes['seller_mega_menus.set_status']
    destroy: typeof routes['seller_mega_menus.destroy']
    storeSection: typeof routes['seller_mega_menus.store_section']
    reorderSections: typeof routes['seller_mega_menus.reorder_sections']
    updateSection: typeof routes['seller_mega_menus.update_section']
    setSectionStatus: typeof routes['seller_mega_menus.set_section_status']
    destroySection: typeof routes['seller_mega_menus.destroy_section']
    storeItem: typeof routes['seller_mega_menus.store_item']
    reorderItems: typeof routes['seller_mega_menus.reorder_items']
    updateItem: typeof routes['seller_mega_menus.update_item']
    setItemStatus: typeof routes['seller_mega_menus.set_item_status']
    destroyItem: typeof routes['seller_mega_menus.destroy_item']
  }
  sellerMarketing: {
    summary: typeof routes['seller_marketing.summary']
  }
  sellerDiscounts: {
    index: typeof routes['seller_discounts.index']
    bulkStatus: typeof routes['seller_discounts.bulk_status']
    bulkDestroy: typeof routes['seller_discounts.bulk_destroy']
    show: typeof routes['seller_discounts.show']
    store: typeof routes['seller_discounts.store']
    update: typeof routes['seller_discounts.update']
    setStatus: typeof routes['seller_discounts.set_status']
    destroy: typeof routes['seller_discounts.destroy']
  }
  sellerCampaigns: {
    index: typeof routes['seller_campaigns.index']
    bulkStatus: typeof routes['seller_campaigns.bulk_status']
    bulkDestroy: typeof routes['seller_campaigns.bulk_destroy']
    show: typeof routes['seller_campaigns.show']
    store: typeof routes['seller_campaigns.store']
    update: typeof routes['seller_campaigns.update']
    setStatus: typeof routes['seller_campaigns.set_status']
    destroy: typeof routes['seller_campaigns.destroy']
  }
  sellerBanners: {
    index: typeof routes['seller_banners.index']
    show: typeof routes['seller_banners.show']
    store: typeof routes['seller_banners.store']
    update: typeof routes['seller_banners.update']
    setActive: typeof routes['seller_banners.set_active']
    destroy: typeof routes['seller_banners.destroy']
  }
  sellerBrands: {
    index: typeof routes['seller_brands.index']
    bulkDestroy: typeof routes['seller_brands.bulk_destroy']
    show: typeof routes['seller_brands.show']
    store: typeof routes['seller_brands.store']
    update: typeof routes['seller_brands.update']
    setStatus: typeof routes['seller_brands.set_status']
    destroy: typeof routes['seller_brands.destroy']
  }
  sellerAttributes: {
    index: typeof routes['seller_attributes.index']
    show: typeof routes['seller_attributes.show']
    store: typeof routes['seller_attributes.store']
    update: typeof routes['seller_attributes.update']
    setStatus: typeof routes['seller_attributes.set_status']
    destroy: typeof routes['seller_attributes.destroy']
  }
  sellerWarehouses: {
    index: typeof routes['seller_warehouses.index']
    show: typeof routes['seller_warehouses.show']
    store: typeof routes['seller_warehouses.store']
    update: typeof routes['seller_warehouses.update']
    destroy: typeof routes['seller_warehouses.destroy']
  }
  sellerInventory: {
    index: typeof routes['seller_inventory.index']
    adjust: typeof routes['seller_inventory.adjust']
  }
  sellerMovements: {
    index: typeof routes['seller_movements.index']
    store: typeof routes['seller_movements.store']
  }
  sellerReturns: {
    index: typeof routes['seller_returns.index']
    show: typeof routes['seller_returns.show']
    store: typeof routes['seller_returns.store']
    setStatus: typeof routes['seller_returns.set_status']
  }
  sellerRefunds: {
    index: typeof routes['seller_refunds.index']
    show: typeof routes['seller_refunds.show']
    store: typeof routes['seller_refunds.store']
    setStatus: typeof routes['seller_refunds.set_status']
  }
  sellerShipping: {
    index: typeof routes['seller_shipping.index']
    store: typeof routes['seller_shipping.store']
    show: typeof routes['seller_shipping.show']
    update: typeof routes['seller_shipping.update']
    destroy: typeof routes['seller_shipping.destroy']
  }
  sellerCustomers: {
    index: typeof routes['seller_customers.index']
    bulkStatus: typeof routes['seller_customers.bulk_status']
    show: typeof routes['seller_customers.show']
    update: typeof routes['seller_customers.update']
    setStatus: typeof routes['seller_customers.set_status']
  }
  sellerTechnolifeImporter: {
    preview: typeof routes['seller_technolife_importer.preview']
    import: typeof routes['seller_technolife_importer.import']
    imports: typeof routes['seller_technolife_importer.imports']
    showImport: typeof routes['seller_technolife_importer.show_import']
    retryImport: typeof routes['seller_technolife_importer.retry_import']
  }
}
