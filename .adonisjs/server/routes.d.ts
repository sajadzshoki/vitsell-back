import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'upload.show': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'auth.request_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.check_phone': { paramsTuple?: []; params?: {} }
    'auth.login_with_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.admin_check_phone': { paramsTuple?: []; params?: {} }
    'auth.admin_login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.facets': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store_question': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'upload.store': { paramsTuple?: []; params?: {} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.site': { paramsTuple?: []; params?: {} }
    'content.about': { paramsTuple?: []; params?: {} }
    'activity.recommendations': { paramsTuple?: []; params?: {} }
    'activity.store': { paramsTuple?: []; params?: {} }
    'activity.sync': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.navigation': { paramsTuple?: []; params?: {} }
    'mega_menu.index': { paramsTuple?: []; params?: {} }
    'mega_menu.resolve': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'wallet.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'cart.index': { paramsTuple?: []; params?: {} }
    'cart.store': { paramsTuple?: []; params?: {} }
    'cart.update': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'cart.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'cart.clear': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'wishlist.store': { paramsTuple?: []; params?: {} }
    'wishlist.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'account.show_profile': { paramsTuple?: []; params?: {} }
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.set_password': { paramsTuple?: []; params?: {} }
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.store_address': { paramsTuple?: []; params?: {} }
    'account.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.destroy_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.reviews': { paramsTuple?: []; params?: {} }
    'wallet.show': { paramsTuple?: []; params?: {} }
    'wallet.top_up': { paramsTuple?: []; params?: {} }
    'wallet.withdraw': { paramsTuple?: []; params?: {} }
    'checkout.place': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.update_shop': { paramsTuple?: []; params?: {} }
    'seller.footer': { paramsTuple?: []; params?: {} }
    'seller.update_footer': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.show_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.store_listing': { paramsTuple?: []; params?: {} }
    'seller.update_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.destroy_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_order_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_order_tracking': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.add_order_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.create_order_refund': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.destroy_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.index': { paramsTuple?: []; params?: {} }
    'seller_reviews.bulk_moderation': { paramsTuple?: []; params?: {} }
    'seller_reviews.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.reply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.set_moderation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.index': { paramsTuple?: []; params?: {} }
    'seller_questions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.reply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.clear_answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.set_verified': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.store_payout': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
    'seller_transactions.index': { paramsTuple?: []; params?: {} }
    'seller_transactions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_payments.index': { paramsTuple?: []; params?: {} }
    'seller_payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settlements.index': { paramsTuple?: []; params?: {} }
    'seller_settlements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settlements.store': { paramsTuple?: []; params?: {} }
    'seller_settlements.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reconciliation.index': { paramsTuple?: []; params?: {} }
    'seller_reconciliation.resolve': { paramsTuple?: []; params?: {} }
    'seller_reconciliation.unresolve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_adjustments.index': { paramsTuple?: []; params?: {} }
    'seller_adjustments.store': { paramsTuple?: []; params?: {} }
    'seller_reports.index': { paramsTuple?: []; params?: {} }
    'categories.admin_index': { paramsTuple?: []; params?: {} }
    'categories.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.index': { paramsTuple?: []; params?: {} }
    'deals.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.store': { paramsTuple?: []; params?: {} }
    'deals.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.index': { paramsTuple?: []; params?: {} }
    'discount_codes.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'discount_codes.store': { paramsTuple?: []; params?: {} }
    'discount_codes.update': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'discount_codes.set_active': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'discount_codes.destroy': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.index': { paramsTuple?: []; params?: {} }
    'content_promos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content_promos.store': { paramsTuple?: []; params?: {} }
    'content_promos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content_promos.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content_promos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.index': { paramsTuple?: []; params?: {} }
    'seller_notifications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.users': { paramsTuple?: []; params?: {} }
    'seller_notifications.preview': { paramsTuple?: []; params?: {} }
    'seller_notifications.store': { paramsTuple?: []; params?: {} }
    'seller_notifications.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.index': { paramsTuple?: []; params?: {} }
    'seller_blog.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.store': { paramsTuple?: []; params?: {} }
    'seller_blog.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.index': { paramsTuple?: []; params?: {} }
    'seller_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.store': { paramsTuple?: []; params?: {} }
    'seller_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_about.show': { paramsTuple?: []; params?: {} }
    'seller_about.update': { paramsTuple?: []; params?: {} }
    'seller_media.index': { paramsTuple?: []; params?: {} }
    'seller_media.store': { paramsTuple?: []; params?: {} }
    'seller_media.register': { paramsTuple?: []; params?: {} }
    'seller_media.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_media.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_media.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_media.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.index': { paramsTuple?: []; params?: {} }
    'seller_admins.store': { paramsTuple?: []; params?: {} }
    'seller_admins.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.index': { paramsTuple?: []; params?: {} }
    'seller_roles.store': { paramsTuple?: []; params?: {} }
    'seller_roles.permissions': { paramsTuple?: []; params?: {} }
    'seller_roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_system.summary': { paramsTuple?: []; params?: {} }
    'seller_audit.index': { paramsTuple?: []; params?: {} }
    'seller_audit.store': { paramsTuple?: []; params?: {} }
    'seller_settings.show': { paramsTuple?: []; params?: {} }
    'seller_settings.update': { paramsTuple?: []; params?: {} }
    'seller_seo.show': { paramsTuple?: []; params?: {} }
    'seller_seo.update': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_index': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_store': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_seo.redirects_destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_navigation.show': { paramsTuple?: []; params?: {} }
    'seller_navigation.update': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.index': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.store': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.store_section': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder_sections': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.update_section': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_section_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy_section': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.store_item': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder_items': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.update_item': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_item_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy_item': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_marketing.summary': { paramsTuple?: []; params?: {} }
    'seller_discounts.index': { paramsTuple?: []; params?: {} }
    'seller_discounts.bulk_status': { paramsTuple?: []; params?: {} }
    'seller_discounts.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_discounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.store': { paramsTuple?: []; params?: {} }
    'seller_discounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.index': { paramsTuple?: []; params?: {} }
    'seller_campaigns.bulk_status': { paramsTuple?: []; params?: {} }
    'seller_campaigns.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_campaigns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.store': { paramsTuple?: []; params?: {} }
    'seller_campaigns.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.index': { paramsTuple?: []; params?: {} }
    'seller_banners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.store': { paramsTuple?: []; params?: {} }
    'seller_banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.index': { paramsTuple?: []; params?: {} }
    'seller_brands.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.store': { paramsTuple?: []; params?: {} }
    'seller_brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.index': { paramsTuple?: []; params?: {} }
    'seller_attributes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.store': { paramsTuple?: []; params?: {} }
    'seller_attributes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.index': { paramsTuple?: []; params?: {} }
    'seller_warehouses.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.store': { paramsTuple?: []; params?: {} }
    'seller_warehouses.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_inventory.index': { paramsTuple?: []; params?: {} }
    'seller_inventory.adjust': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller_movements.index': { paramsTuple?: []; params?: {} }
    'seller_movements.store': { paramsTuple?: []; params?: {} }
    'seller_returns.index': { paramsTuple?: []; params?: {} }
    'seller_returns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_returns.store': { paramsTuple?: []; params?: {} }
    'seller_returns.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_refunds.index': { paramsTuple?: []; params?: {} }
    'seller_refunds.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_refunds.store': { paramsTuple?: []; params?: {} }
    'seller_refunds.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.index': { paramsTuple?: []; params?: {} }
    'seller_shipping.store': { paramsTuple?: []; params?: {} }
    'seller_shipping.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.index': { paramsTuple?: []; params?: {} }
    'seller_customers.bulk_status': { paramsTuple?: []; params?: {} }
    'seller_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'upload.show': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.facets': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.site': { paramsTuple?: []; params?: {} }
    'content.about': { paramsTuple?: []; params?: {} }
    'activity.recommendations': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.navigation': { paramsTuple?: []; params?: {} }
    'mega_menu.index': { paramsTuple?: []; params?: {} }
    'mega_menu.resolve': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'wallet.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'cart.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'account.show_profile': { paramsTuple?: []; params?: {} }
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.reviews': { paramsTuple?: []; params?: {} }
    'wallet.show': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.footer': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.show_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.index': { paramsTuple?: []; params?: {} }
    'seller_reviews.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.index': { paramsTuple?: []; params?: {} }
    'seller_questions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
    'seller_transactions.index': { paramsTuple?: []; params?: {} }
    'seller_transactions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_payments.index': { paramsTuple?: []; params?: {} }
    'seller_payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settlements.index': { paramsTuple?: []; params?: {} }
    'seller_settlements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reconciliation.index': { paramsTuple?: []; params?: {} }
    'seller_adjustments.index': { paramsTuple?: []; params?: {} }
    'seller_reports.index': { paramsTuple?: []; params?: {} }
    'categories.admin_index': { paramsTuple?: []; params?: {} }
    'categories.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.index': { paramsTuple?: []; params?: {} }
    'deals.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.index': { paramsTuple?: []; params?: {} }
    'discount_codes.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.index': { paramsTuple?: []; params?: {} }
    'content_promos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.index': { paramsTuple?: []; params?: {} }
    'seller_notifications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.users': { paramsTuple?: []; params?: {} }
    'seller_blog.index': { paramsTuple?: []; params?: {} }
    'seller_blog.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.index': { paramsTuple?: []; params?: {} }
    'seller_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_about.show': { paramsTuple?: []; params?: {} }
    'seller_media.index': { paramsTuple?: []; params?: {} }
    'seller_media.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.index': { paramsTuple?: []; params?: {} }
    'seller_admins.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.index': { paramsTuple?: []; params?: {} }
    'seller_roles.permissions': { paramsTuple?: []; params?: {} }
    'seller_roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_system.summary': { paramsTuple?: []; params?: {} }
    'seller_audit.index': { paramsTuple?: []; params?: {} }
    'seller_settings.show': { paramsTuple?: []; params?: {} }
    'seller_seo.show': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_index': { paramsTuple?: []; params?: {} }
    'seller_navigation.show': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.index': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_marketing.summary': { paramsTuple?: []; params?: {} }
    'seller_discounts.index': { paramsTuple?: []; params?: {} }
    'seller_discounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.index': { paramsTuple?: []; params?: {} }
    'seller_campaigns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.index': { paramsTuple?: []; params?: {} }
    'seller_banners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.index': { paramsTuple?: []; params?: {} }
    'seller_brands.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.index': { paramsTuple?: []; params?: {} }
    'seller_attributes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.index': { paramsTuple?: []; params?: {} }
    'seller_warehouses.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_inventory.index': { paramsTuple?: []; params?: {} }
    'seller_movements.index': { paramsTuple?: []; params?: {} }
    'seller_returns.index': { paramsTuple?: []; params?: {} }
    'seller_returns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_refunds.index': { paramsTuple?: []; params?: {} }
    'seller_refunds.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.index': { paramsTuple?: []; params?: {} }
    'seller_shipping.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.index': { paramsTuple?: []; params?: {} }
    'seller_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'upload.show': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.facets': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.site': { paramsTuple?: []; params?: {} }
    'content.about': { paramsTuple?: []; params?: {} }
    'activity.recommendations': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.navigation': { paramsTuple?: []; params?: {} }
    'mega_menu.index': { paramsTuple?: []; params?: {} }
    'mega_menu.resolve': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'wallet.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'cart.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'account.show_profile': { paramsTuple?: []; params?: {} }
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.reviews': { paramsTuple?: []; params?: {} }
    'wallet.show': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.footer': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.show_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.index': { paramsTuple?: []; params?: {} }
    'seller_reviews.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.index': { paramsTuple?: []; params?: {} }
    'seller_questions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
    'seller_transactions.index': { paramsTuple?: []; params?: {} }
    'seller_transactions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_payments.index': { paramsTuple?: []; params?: {} }
    'seller_payments.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settlements.index': { paramsTuple?: []; params?: {} }
    'seller_settlements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reconciliation.index': { paramsTuple?: []; params?: {} }
    'seller_adjustments.index': { paramsTuple?: []; params?: {} }
    'seller_reports.index': { paramsTuple?: []; params?: {} }
    'categories.admin_index': { paramsTuple?: []; params?: {} }
    'categories.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.index': { paramsTuple?: []; params?: {} }
    'deals.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.index': { paramsTuple?: []; params?: {} }
    'discount_codes.show': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.index': { paramsTuple?: []; params?: {} }
    'content_promos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.index': { paramsTuple?: []; params?: {} }
    'seller_notifications.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.users': { paramsTuple?: []; params?: {} }
    'seller_blog.index': { paramsTuple?: []; params?: {} }
    'seller_blog.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.index': { paramsTuple?: []; params?: {} }
    'seller_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_about.show': { paramsTuple?: []; params?: {} }
    'seller_media.index': { paramsTuple?: []; params?: {} }
    'seller_media.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.index': { paramsTuple?: []; params?: {} }
    'seller_admins.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.index': { paramsTuple?: []; params?: {} }
    'seller_roles.permissions': { paramsTuple?: []; params?: {} }
    'seller_roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_system.summary': { paramsTuple?: []; params?: {} }
    'seller_audit.index': { paramsTuple?: []; params?: {} }
    'seller_settings.show': { paramsTuple?: []; params?: {} }
    'seller_seo.show': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_index': { paramsTuple?: []; params?: {} }
    'seller_navigation.show': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.index': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_marketing.summary': { paramsTuple?: []; params?: {} }
    'seller_discounts.index': { paramsTuple?: []; params?: {} }
    'seller_discounts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.index': { paramsTuple?: []; params?: {} }
    'seller_campaigns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.index': { paramsTuple?: []; params?: {} }
    'seller_banners.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.index': { paramsTuple?: []; params?: {} }
    'seller_brands.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.index': { paramsTuple?: []; params?: {} }
    'seller_attributes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.index': { paramsTuple?: []; params?: {} }
    'seller_warehouses.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_inventory.index': { paramsTuple?: []; params?: {} }
    'seller_movements.index': { paramsTuple?: []; params?: {} }
    'seller_returns.index': { paramsTuple?: []; params?: {} }
    'seller_returns.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_refunds.index': { paramsTuple?: []; params?: {} }
    'seller_refunds.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.index': { paramsTuple?: []; params?: {} }
    'seller_shipping.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.index': { paramsTuple?: []; params?: {} }
    'seller_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.request_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.check_phone': { paramsTuple?: []; params?: {} }
    'auth.login_with_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.admin_check_phone': { paramsTuple?: []; params?: {} }
    'auth.admin_login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'products.store_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.store_question': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'upload.store': { paramsTuple?: []; params?: {} }
    'activity.store': { paramsTuple?: []; params?: {} }
    'activity.sync': { paramsTuple?: []; params?: {} }
    'cart.store': { paramsTuple?: []; params?: {} }
    'wishlist.store': { paramsTuple?: []; params?: {} }
    'account.store_address': { paramsTuple?: []; params?: {} }
    'wallet.top_up': { paramsTuple?: []; params?: {} }
    'wallet.withdraw': { paramsTuple?: []; params?: {} }
    'checkout.place': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'seller.store_listing': { paramsTuple?: []; params?: {} }
    'seller.add_order_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.create_order_refund': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.bulk_moderation': { paramsTuple?: []; params?: {} }
    'seller_reviews.reply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.reply': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.store_payout': { paramsTuple?: []; params?: {} }
    'seller_settlements.store': { paramsTuple?: []; params?: {} }
    'seller_reconciliation.resolve': { paramsTuple?: []; params?: {} }
    'seller_adjustments.store': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'deals.store': { paramsTuple?: []; params?: {} }
    'discount_codes.store': { paramsTuple?: []; params?: {} }
    'content_promos.store': { paramsTuple?: []; params?: {} }
    'seller_notifications.preview': { paramsTuple?: []; params?: {} }
    'seller_notifications.store': { paramsTuple?: []; params?: {} }
    'seller_blog.store': { paramsTuple?: []; params?: {} }
    'seller_pages.store': { paramsTuple?: []; params?: {} }
    'seller_media.store': { paramsTuple?: []; params?: {} }
    'seller_media.register': { paramsTuple?: []; params?: {} }
    'seller_media.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_admins.store': { paramsTuple?: []; params?: {} }
    'seller_roles.store': { paramsTuple?: []; params?: {} }
    'seller_audit.store': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_store': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.store': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.store_section': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder_sections': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.store_item': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.reorder_items': { paramsTuple?: []; params?: {} }
    'seller_discounts.bulk_status': { paramsTuple?: []; params?: {} }
    'seller_discounts.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_discounts.store': { paramsTuple?: []; params?: {} }
    'seller_campaigns.bulk_status': { paramsTuple?: []; params?: {} }
    'seller_campaigns.bulk_destroy': { paramsTuple?: []; params?: {} }
    'seller_campaigns.store': { paramsTuple?: []; params?: {} }
    'seller_banners.store': { paramsTuple?: []; params?: {} }
    'seller_brands.store': { paramsTuple?: []; params?: {} }
    'seller_attributes.store': { paramsTuple?: []; params?: {} }
    'seller_warehouses.store': { paramsTuple?: []; params?: {} }
    'seller_movements.store': { paramsTuple?: []; params?: {} }
    'seller_returns.store': { paramsTuple?: []; params?: {} }
    'seller_refunds.store': { paramsTuple?: []; params?: {} }
    'seller_shipping.store': { paramsTuple?: []; params?: {} }
    'seller_customers.bulk_status': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'cart.update': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.update_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.update_order_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_order_tracking': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reviews.set_moderation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.set_verified': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settlements.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.set_active': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_section_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.set_item_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.set_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_inventory.adjust': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller_returns.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_refunds.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_customers.set_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'cart.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'cart.clear': { paramsTuple?: []; params?: {} }
    'wishlist.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'account.destroy_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.destroy_listing': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.destroy_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.clear_answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_questions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_reconciliation.unresolve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.destroy': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_media.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_seo.redirects_destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy_section': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.destroy_item': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_shipping.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.set_password': { paramsTuple?: []; params?: {} }
    'account.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_shop': { paramsTuple?: []; params?: {} }
    'seller.update_footer': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'deals.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'discount_codes.update': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'content_promos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_blog.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_about.update': { paramsTuple?: []; params?: {} }
    'seller_media.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_admins.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_settings.update': { paramsTuple?: []; params?: {} }
    'seller_seo.update': { paramsTuple?: []; params?: {} }
    'seller_seo.redirects_update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_navigation.update': { paramsTuple?: []; params?: {} }
    'seller_mega_menus.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.update_section': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_mega_menus.update_item': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_discounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_campaigns.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_attributes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller_warehouses.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}