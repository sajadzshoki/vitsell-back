import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.request_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
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
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.store_address': { paramsTuple?: []; params?: {} }
    'account.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.destroy_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.place': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.update_shop': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_order_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.reviews': { paramsTuple?: []; params?: {} }
    'seller.reply_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'cart.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'account.show_profile': { paramsTuple?: []; params?: {} }
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.reviews': { paramsTuple?: []; params?: {} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.page_meta': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.reviews': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.questions': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.home': { paramsTuple?: []; params?: {} }
    'content.locations': { paramsTuple?: []; params?: {} }
    'content.compare_templates': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'content.footer': { paramsTuple?: []; params?: {} }
    'content.discount_codes': { paramsTuple?: []; params?: {} }
    'content.blog_index': { paramsTuple?: []; params?: {} }
    'content.blog_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'content.static_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'checkout.zarinpal_callback': { paramsTuple?: []; params?: {} }
    'cart.index': { paramsTuple?: []; params?: {} }
    'wishlist.index': { paramsTuple?: []; params?: {} }
    'account.show_profile': { paramsTuple?: []; params?: {} }
    'account.addresses': { paramsTuple?: []; params?: {} }
    'account.orders': { paramsTuple?: []; params?: {} }
    'account.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'seller.shop': { paramsTuple?: []; params?: {} }
    'seller.listings': { paramsTuple?: []; params?: {} }
    'seller.orders': { paramsTuple?: []; params?: {} }
    'seller.show_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.reviews': { paramsTuple?: []; params?: {} }
    'seller.payouts': { paramsTuple?: []; params?: {} }
    'seller.sales': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.request_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'cart.store': { paramsTuple?: []; params?: {} }
    'wishlist.store': { paramsTuple?: []; params?: {} }
    'account.store_address': { paramsTuple?: []; params?: {} }
    'checkout.place': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'seller.reply_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'cart.update': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'seller.update_order_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'cart.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'cart.clear': { paramsTuple?: []; params?: {} }
    'wishlist.destroy': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'account.destroy_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'account.update_profile': { paramsTuple?: []; params?: {} }
    'account.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'seller.update_shop': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}