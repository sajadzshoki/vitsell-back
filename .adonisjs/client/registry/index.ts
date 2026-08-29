/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.request_otp': {
    methods: ["POST"],
    pattern: '/api/v1/auth/otp/request',
    tokens: [{"old":"/api/v1/auth/otp/request","type":0,"val":"api","end":""},{"old":"/api/v1/auth/otp/request","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/otp/request","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/otp/request","type":0,"val":"otp","end":""},{"old":"/api/v1/auth/otp/request","type":0,"val":"request","end":""}],
    types: placeholder as Registry['auth.request_otp']['types'],
  },
  'auth.verify_otp': {
    methods: ["POST"],
    pattern: '/api/v1/auth/otp/verify',
    tokens: [{"old":"/api/v1/auth/otp/verify","type":0,"val":"api","end":""},{"old":"/api/v1/auth/otp/verify","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/otp/verify","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/otp/verify","type":0,"val":"otp","end":""},{"old":"/api/v1/auth/otp/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['auth.verify_otp']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/me',
    tokens: [{"old":"/api/v1/auth/me","type":0,"val":"api","end":""},{"old":"/api/v1/auth/me","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/me","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/v1/auth/logout',
    tokens: [{"old":"/api/v1/auth/logout","type":0,"val":"api","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/categories',
    tokens: [{"old":"/api/v1/categories","type":0,"val":"api","end":""},{"old":"/api/v1/categories","type":0,"val":"v1","end":""},{"old":"/api/v1/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['categories.index']['types'],
  },
  'categories.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/categories/:id',
    tokens: [{"old":"/api/v1/categories/:id","type":0,"val":"api","end":""},{"old":"/api/v1/categories/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/categories/:id","type":0,"val":"categories","end":""},{"old":"/api/v1/categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categories.show']['types'],
  },
  'categories.page_meta': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/category-pages/:id',
    tokens: [{"old":"/api/v1/category-pages/:id","type":0,"val":"api","end":""},{"old":"/api/v1/category-pages/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/category-pages/:id","type":0,"val":"category-pages","end":""},{"old":"/api/v1/category-pages/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categories.page_meta']['types'],
  },
  'products.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products',
    tokens: [{"old":"/api/v1/products","type":0,"val":"api","end":""},{"old":"/api/v1/products","type":0,"val":"v1","end":""},{"old":"/api/v1/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.index']['types'],
  },
  'products.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products/:id',
    tokens: [{"old":"/api/v1/products/:id","type":0,"val":"api","end":""},{"old":"/api/v1/products/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/products/:id","type":0,"val":"products","end":""},{"old":"/api/v1/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.show']['types'],
  },
  'products.reviews': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products/:id/reviews',
    tokens: [{"old":"/api/v1/products/:id/reviews","type":0,"val":"api","end":""},{"old":"/api/v1/products/:id/reviews","type":0,"val":"v1","end":""},{"old":"/api/v1/products/:id/reviews","type":0,"val":"products","end":""},{"old":"/api/v1/products/:id/reviews","type":1,"val":"id","end":""},{"old":"/api/v1/products/:id/reviews","type":0,"val":"reviews","end":""}],
    types: placeholder as Registry['products.reviews']['types'],
  },
  'products.questions': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products/:id/questions',
    tokens: [{"old":"/api/v1/products/:id/questions","type":0,"val":"api","end":""},{"old":"/api/v1/products/:id/questions","type":0,"val":"v1","end":""},{"old":"/api/v1/products/:id/questions","type":0,"val":"products","end":""},{"old":"/api/v1/products/:id/questions","type":1,"val":"id","end":""},{"old":"/api/v1/products/:id/questions","type":0,"val":"questions","end":""}],
    types: placeholder as Registry['products.questions']['types'],
  },
  'content.home': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/home',
    tokens: [{"old":"/api/v1/home","type":0,"val":"api","end":""},{"old":"/api/v1/home","type":0,"val":"v1","end":""},{"old":"/api/v1/home","type":0,"val":"home","end":""}],
    types: placeholder as Registry['content.home']['types'],
  },
  'content.locations': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/locations',
    tokens: [{"old":"/api/v1/locations","type":0,"val":"api","end":""},{"old":"/api/v1/locations","type":0,"val":"v1","end":""},{"old":"/api/v1/locations","type":0,"val":"locations","end":""}],
    types: placeholder as Registry['content.locations']['types'],
  },
  'content.compare_templates': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/compare/templates/:category',
    tokens: [{"old":"/api/v1/compare/templates/:category","type":0,"val":"api","end":""},{"old":"/api/v1/compare/templates/:category","type":0,"val":"v1","end":""},{"old":"/api/v1/compare/templates/:category","type":0,"val":"compare","end":""},{"old":"/api/v1/compare/templates/:category","type":0,"val":"templates","end":""},{"old":"/api/v1/compare/templates/:category","type":1,"val":"category","end":""}],
    types: placeholder as Registry['content.compare_templates']['types'],
  },
  'content.footer': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/footer',
    tokens: [{"old":"/api/v1/footer","type":0,"val":"api","end":""},{"old":"/api/v1/footer","type":0,"val":"v1","end":""},{"old":"/api/v1/footer","type":0,"val":"footer","end":""}],
    types: placeholder as Registry['content.footer']['types'],
  },
  'content.discount_codes': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/discount-codes',
    tokens: [{"old":"/api/v1/discount-codes","type":0,"val":"api","end":""},{"old":"/api/v1/discount-codes","type":0,"val":"v1","end":""},{"old":"/api/v1/discount-codes","type":0,"val":"discount-codes","end":""}],
    types: placeholder as Registry['content.discount_codes']['types'],
  },
  'content.blog_index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/blog',
    tokens: [{"old":"/api/v1/blog","type":0,"val":"api","end":""},{"old":"/api/v1/blog","type":0,"val":"v1","end":""},{"old":"/api/v1/blog","type":0,"val":"blog","end":""}],
    types: placeholder as Registry['content.blog_index']['types'],
  },
  'content.blog_show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/blog/:id',
    tokens: [{"old":"/api/v1/blog/:id","type":0,"val":"api","end":""},{"old":"/api/v1/blog/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/blog/:id","type":0,"val":"blog","end":""},{"old":"/api/v1/blog/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['content.blog_show']['types'],
  },
  'content.static_page': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/static-pages/:id',
    tokens: [{"old":"/api/v1/static-pages/:id","type":0,"val":"api","end":""},{"old":"/api/v1/static-pages/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/static-pages/:id","type":0,"val":"static-pages","end":""},{"old":"/api/v1/static-pages/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['content.static_page']['types'],
  },
  'checkout.zarinpal_callback': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/payments/zarinpal/callback',
    tokens: [{"old":"/api/v1/payments/zarinpal/callback","type":0,"val":"api","end":""},{"old":"/api/v1/payments/zarinpal/callback","type":0,"val":"v1","end":""},{"old":"/api/v1/payments/zarinpal/callback","type":0,"val":"payments","end":""},{"old":"/api/v1/payments/zarinpal/callback","type":0,"val":"zarinpal","end":""},{"old":"/api/v1/payments/zarinpal/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['checkout.zarinpal_callback']['types'],
  },
  'cart.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/cart',
    tokens: [{"old":"/api/v1/cart","type":0,"val":"api","end":""},{"old":"/api/v1/cart","type":0,"val":"v1","end":""},{"old":"/api/v1/cart","type":0,"val":"cart","end":""}],
    types: placeholder as Registry['cart.index']['types'],
  },
  'cart.store': {
    methods: ["POST"],
    pattern: '/api/v1/cart',
    tokens: [{"old":"/api/v1/cart","type":0,"val":"api","end":""},{"old":"/api/v1/cart","type":0,"val":"v1","end":""},{"old":"/api/v1/cart","type":0,"val":"cart","end":""}],
    types: placeholder as Registry['cart.store']['types'],
  },
  'cart.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/cart/:productId',
    tokens: [{"old":"/api/v1/cart/:productId","type":0,"val":"api","end":""},{"old":"/api/v1/cart/:productId","type":0,"val":"v1","end":""},{"old":"/api/v1/cart/:productId","type":0,"val":"cart","end":""},{"old":"/api/v1/cart/:productId","type":1,"val":"productId","end":""}],
    types: placeholder as Registry['cart.update']['types'],
  },
  'cart.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/cart/:productId',
    tokens: [{"old":"/api/v1/cart/:productId","type":0,"val":"api","end":""},{"old":"/api/v1/cart/:productId","type":0,"val":"v1","end":""},{"old":"/api/v1/cart/:productId","type":0,"val":"cart","end":""},{"old":"/api/v1/cart/:productId","type":1,"val":"productId","end":""}],
    types: placeholder as Registry['cart.destroy']['types'],
  },
  'cart.clear': {
    methods: ["DELETE"],
    pattern: '/api/v1/cart',
    tokens: [{"old":"/api/v1/cart","type":0,"val":"api","end":""},{"old":"/api/v1/cart","type":0,"val":"v1","end":""},{"old":"/api/v1/cart","type":0,"val":"cart","end":""}],
    types: placeholder as Registry['cart.clear']['types'],
  },
  'wishlist.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/wishlist',
    tokens: [{"old":"/api/v1/wishlist","type":0,"val":"api","end":""},{"old":"/api/v1/wishlist","type":0,"val":"v1","end":""},{"old":"/api/v1/wishlist","type":0,"val":"wishlist","end":""}],
    types: placeholder as Registry['wishlist.index']['types'],
  },
  'wishlist.store': {
    methods: ["POST"],
    pattern: '/api/v1/wishlist',
    tokens: [{"old":"/api/v1/wishlist","type":0,"val":"api","end":""},{"old":"/api/v1/wishlist","type":0,"val":"v1","end":""},{"old":"/api/v1/wishlist","type":0,"val":"wishlist","end":""}],
    types: placeholder as Registry['wishlist.store']['types'],
  },
  'wishlist.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/wishlist/:productId',
    tokens: [{"old":"/api/v1/wishlist/:productId","type":0,"val":"api","end":""},{"old":"/api/v1/wishlist/:productId","type":0,"val":"v1","end":""},{"old":"/api/v1/wishlist/:productId","type":0,"val":"wishlist","end":""},{"old":"/api/v1/wishlist/:productId","type":1,"val":"productId","end":""}],
    types: placeholder as Registry['wishlist.destroy']['types'],
  },
  'account.show_profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.show_profile']['types'],
  },
  'account.update_profile': {
    methods: ["PUT"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.update_profile']['types'],
  },
  'account.addresses': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/addresses',
    tokens: [{"old":"/api/v1/account/addresses","type":0,"val":"api","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"v1","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"account","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"addresses","end":""}],
    types: placeholder as Registry['account.addresses']['types'],
  },
  'account.store_address': {
    methods: ["POST"],
    pattern: '/api/v1/account/addresses',
    tokens: [{"old":"/api/v1/account/addresses","type":0,"val":"api","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"v1","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"account","end":""},{"old":"/api/v1/account/addresses","type":0,"val":"addresses","end":""}],
    types: placeholder as Registry['account.store_address']['types'],
  },
  'account.update_address': {
    methods: ["PUT"],
    pattern: '/api/v1/account/addresses/:id',
    tokens: [{"old":"/api/v1/account/addresses/:id","type":0,"val":"api","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"account","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"addresses","end":""},{"old":"/api/v1/account/addresses/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['account.update_address']['types'],
  },
  'account.destroy_address': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/addresses/:id',
    tokens: [{"old":"/api/v1/account/addresses/:id","type":0,"val":"api","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"account","end":""},{"old":"/api/v1/account/addresses/:id","type":0,"val":"addresses","end":""},{"old":"/api/v1/account/addresses/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['account.destroy_address']['types'],
  },
  'account.orders': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/orders',
    tokens: [{"old":"/api/v1/account/orders","type":0,"val":"api","end":""},{"old":"/api/v1/account/orders","type":0,"val":"v1","end":""},{"old":"/api/v1/account/orders","type":0,"val":"account","end":""},{"old":"/api/v1/account/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['account.orders']['types'],
  },
  'account.show_order': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/orders/:id',
    tokens: [{"old":"/api/v1/account/orders/:id","type":0,"val":"api","end":""},{"old":"/api/v1/account/orders/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/account/orders/:id","type":0,"val":"account","end":""},{"old":"/api/v1/account/orders/:id","type":0,"val":"orders","end":""},{"old":"/api/v1/account/orders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['account.show_order']['types'],
  },
  'checkout.place': {
    methods: ["POST"],
    pattern: '/api/v1/checkout/place',
    tokens: [{"old":"/api/v1/checkout/place","type":0,"val":"api","end":""},{"old":"/api/v1/checkout/place","type":0,"val":"v1","end":""},{"old":"/api/v1/checkout/place","type":0,"val":"checkout","end":""},{"old":"/api/v1/checkout/place","type":0,"val":"place","end":""}],
    types: placeholder as Registry['checkout.place']['types'],
  },
  'notifications.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/notifications',
    tokens: [{"old":"/api/v1/notifications","type":0,"val":"api","end":""},{"old":"/api/v1/notifications","type":0,"val":"v1","end":""},{"old":"/api/v1/notifications","type":0,"val":"notifications","end":""}],
    types: placeholder as Registry['notifications.index']['types'],
  },
  'notifications.mark_read': {
    methods: ["POST"],
    pattern: '/api/v1/notifications/:id/read',
    tokens: [{"old":"/api/v1/notifications/:id/read","type":0,"val":"api","end":""},{"old":"/api/v1/notifications/:id/read","type":0,"val":"v1","end":""},{"old":"/api/v1/notifications/:id/read","type":0,"val":"notifications","end":""},{"old":"/api/v1/notifications/:id/read","type":1,"val":"id","end":""},{"old":"/api/v1/notifications/:id/read","type":0,"val":"read","end":""}],
    types: placeholder as Registry['notifications.mark_read']['types'],
  },
  'notifications.mark_all_read': {
    methods: ["POST"],
    pattern: '/api/v1/notifications/read-all',
    tokens: [{"old":"/api/v1/notifications/read-all","type":0,"val":"api","end":""},{"old":"/api/v1/notifications/read-all","type":0,"val":"v1","end":""},{"old":"/api/v1/notifications/read-all","type":0,"val":"notifications","end":""},{"old":"/api/v1/notifications/read-all","type":0,"val":"read-all","end":""}],
    types: placeholder as Registry['notifications.mark_all_read']['types'],
  },
  'seller.shop': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/shop',
    tokens: [{"old":"/api/v1/seller/shop","type":0,"val":"api","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"shop","end":""}],
    types: placeholder as Registry['seller.shop']['types'],
  },
  'seller.update_shop': {
    methods: ["PUT"],
    pattern: '/api/v1/seller/shop',
    tokens: [{"old":"/api/v1/seller/shop","type":0,"val":"api","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/shop","type":0,"val":"shop","end":""}],
    types: placeholder as Registry['seller.update_shop']['types'],
  },
  'seller.listings': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/listings',
    tokens: [{"old":"/api/v1/seller/listings","type":0,"val":"api","end":""},{"old":"/api/v1/seller/listings","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/listings","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/listings","type":0,"val":"listings","end":""}],
    types: placeholder as Registry['seller.listings']['types'],
  },
  'seller.orders': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/orders',
    tokens: [{"old":"/api/v1/seller/orders","type":0,"val":"api","end":""},{"old":"/api/v1/seller/orders","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/orders","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['seller.orders']['types'],
  },
  'seller.show_order': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/orders/:id',
    tokens: [{"old":"/api/v1/seller/orders/:id","type":0,"val":"api","end":""},{"old":"/api/v1/seller/orders/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/orders/:id","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/orders/:id","type":0,"val":"orders","end":""},{"old":"/api/v1/seller/orders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['seller.show_order']['types'],
  },
  'seller.update_order_status': {
    methods: ["PATCH"],
    pattern: '/api/v1/seller/orders/:id/status',
    tokens: [{"old":"/api/v1/seller/orders/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/seller/orders/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/orders/:id/status","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/orders/:id/status","type":0,"val":"orders","end":""},{"old":"/api/v1/seller/orders/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/seller/orders/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['seller.update_order_status']['types'],
  },
  'seller.reviews': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/reviews',
    tokens: [{"old":"/api/v1/seller/reviews","type":0,"val":"api","end":""},{"old":"/api/v1/seller/reviews","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/reviews","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/reviews","type":0,"val":"reviews","end":""}],
    types: placeholder as Registry['seller.reviews']['types'],
  },
  'seller.reply_review': {
    methods: ["POST"],
    pattern: '/api/v1/seller/reviews/:id/reply',
    tokens: [{"old":"/api/v1/seller/reviews/:id/reply","type":0,"val":"api","end":""},{"old":"/api/v1/seller/reviews/:id/reply","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/reviews/:id/reply","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/reviews/:id/reply","type":0,"val":"reviews","end":""},{"old":"/api/v1/seller/reviews/:id/reply","type":1,"val":"id","end":""},{"old":"/api/v1/seller/reviews/:id/reply","type":0,"val":"reply","end":""}],
    types: placeholder as Registry['seller.reply_review']['types'],
  },
  'seller.payouts': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/payouts',
    tokens: [{"old":"/api/v1/seller/payouts","type":0,"val":"api","end":""},{"old":"/api/v1/seller/payouts","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/payouts","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/payouts","type":0,"val":"payouts","end":""}],
    types: placeholder as Registry['seller.payouts']['types'],
  },
  'seller.sales': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/seller/sales',
    tokens: [{"old":"/api/v1/seller/sales","type":0,"val":"api","end":""},{"old":"/api/v1/seller/sales","type":0,"val":"v1","end":""},{"old":"/api/v1/seller/sales","type":0,"val":"seller","end":""},{"old":"/api/v1/seller/sales","type":0,"val":"sales","end":""}],
    types: placeholder as Registry['seller.sales']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
