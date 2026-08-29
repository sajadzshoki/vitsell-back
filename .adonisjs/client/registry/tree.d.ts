/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    requestOtp: typeof routes['auth.request_otp']
    verifyOtp: typeof routes['auth.verify_otp']
    me: typeof routes['auth.me']
    logout: typeof routes['auth.logout']
  }
  categories: {
    index: typeof routes['categories.index']
    show: typeof routes['categories.show']
    pageMeta: typeof routes['categories.page_meta']
  }
  products: {
    index: typeof routes['products.index']
    show: typeof routes['products.show']
    reviews: typeof routes['products.reviews']
    questions: typeof routes['products.questions']
  }
  content: {
    home: typeof routes['content.home']
    locations: typeof routes['content.locations']
    compareTemplates: typeof routes['content.compare_templates']
    footer: typeof routes['content.footer']
    discountCodes: typeof routes['content.discount_codes']
    blogIndex: typeof routes['content.blog_index']
    blogShow: typeof routes['content.blog_show']
    staticPage: typeof routes['content.static_page']
  }
  checkout: {
    zarinpalCallback: typeof routes['checkout.zarinpal_callback']
    place: typeof routes['checkout.place']
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
    addresses: typeof routes['account.addresses']
    storeAddress: typeof routes['account.store_address']
    updateAddress: typeof routes['account.update_address']
    destroyAddress: typeof routes['account.destroy_address']
    orders: typeof routes['account.orders']
    showOrder: typeof routes['account.show_order']
  }
  notifications: {
    index: typeof routes['notifications.index']
    markRead: typeof routes['notifications.mark_read']
    markAllRead: typeof routes['notifications.mark_all_read']
  }
  seller: {
    shop: typeof routes['seller.shop']
    updateShop: typeof routes['seller.update_shop']
    listings: typeof routes['seller.listings']
    orders: typeof routes['seller.orders']
    showOrder: typeof routes['seller.show_order']
    updateOrderStatus: typeof routes['seller.update_order_status']
    reviews: typeof routes['seller.reviews']
    replyReview: typeof routes['seller.reply_review']
    payouts: typeof routes['seller.payouts']
    sales: typeof routes['seller.sales']
  }
}
