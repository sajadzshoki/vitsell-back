/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'upload.show': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/:file'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { file: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/upload_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/upload_controller').default['show']>>>
    }
  }
  'auth.request_otp': {
    methods: ["POST"]
    pattern: '/api/v1/auth/otp/request'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['requestOtp']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['requestOtp']>>>
    }
  }
  'auth.verify_otp': {
    methods: ["POST"]
    pattern: '/api/v1/auth/otp/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyOtp']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyOtp']>>>
    }
  }
  'auth.check_phone': {
    methods: ["POST"]
    pattern: '/api/v1/auth/check'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['checkPhone']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['checkPhone']>>>
    }
  }
  'auth.login_with_password': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['loginWithPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['loginWithPassword']>>>
    }
  }
  'auth.reset_password': {
    methods: ["POST"]
    pattern: '/api/v1/auth/password/reset'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
    }
  }
  'auth.admin_check_phone': {
    methods: ["POST"]
    pattern: '/api/v1/auth/admin/check'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['adminCheckPhone']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['adminCheckPhone']>>>
    }
  }
  'auth.admin_login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/admin/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['adminLogin']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['adminLogin']>>>
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/v1/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
    }
  }
  'categories.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['show']>>>
    }
  }
  'categories.page_meta': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/category-pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['pageMeta']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['pageMeta']>>>
    }
  }
  'products.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
    }
  }
  'products.facets': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/catalog/facets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['facets']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['facets']>>>
    }
  }
  'products.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
    }
  }
  'products.reviews': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products/:id/reviews'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['reviews']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['reviews']>>>
    }
  }
  'products.store_review': {
    methods: ["POST"]
    pattern: '/api/v1/products/:id/reviews'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeReview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeReview']>>>
    }
  }
  'products.questions': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products/:id/questions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['questions']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['questions']>>>
    }
  }
  'products.store_question': {
    methods: ["POST"]
    pattern: '/api/v1/products/:id/questions'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeQuestion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeQuestion']>>>
    }
  }
  'upload.store': {
    methods: ["POST"]
    pattern: '/api/v1/upload'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/upload_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/upload_controller').default['store']>>>
    }
  }
  'content.home': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/home'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['home']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['home']>>>
    }
  }
  'content.site': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/site'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['site']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['site']>>>
    }
  }
  'content.about': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/about'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['about']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['about']>>>
    }
  }
  'activity.recommendations': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/recommendations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['recommendations']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['recommendations']>>>
    }
  }
  'activity.store': {
    methods: ["POST"]
    pattern: '/api/v1/activity'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['store']>>>
    }
  }
  'activity.sync': {
    methods: ["POST"]
    pattern: '/api/v1/activity/sync'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['sync']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_controller').default['sync']>>>
    }
  }
  'content.locations': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/locations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['locations']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['locations']>>>
    }
  }
  'content.compare_templates': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/compare/templates/:category'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { category: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['compareTemplates']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['compareTemplates']>>>
    }
  }
  'content.footer': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/footer'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['footer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['footer']>>>
    }
  }
  'content.navigation': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/navigation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['navigation']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['navigation']>>>
    }
  }
  'content.discount_codes': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/discount-codes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['discountCodes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['discountCodes']>>>
    }
  }
  'content.blog_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/blog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['blogIndex']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['blogIndex']>>>
    }
  }
  'content.blog_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/blog/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['blogShow']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['blogShow']>>>
    }
  }
  'content.static_page': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/static-pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_controller').default['staticPage']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_controller').default['staticPage']>>>
    }
  }
  'checkout.zarinpal_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/payments/zarinpal/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkout_controller').default['zarinpalCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkout_controller').default['zarinpalCallback']>>>
    }
  }
  'wallet.zarinpal_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/payments/zarinpal/wallet-callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['zarinpalCallback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['zarinpalCallback']>>>
    }
  }
  'cart.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/cart'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['index']>>>
    }
  }
  'cart.store': {
    methods: ["POST"]
    pattern: '/api/v1/cart'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['store']>>>
    }
  }
  'cart.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/cart/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['update']>>>
    }
  }
  'cart.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/cart/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['destroy']>>>
    }
  }
  'cart.clear': {
    methods: ["DELETE"]
    pattern: '/api/v1/cart'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['clear']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['clear']>>>
    }
  }
  'wishlist.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['index']>>>
    }
  }
  'wishlist.store': {
    methods: ["POST"]
    pattern: '/api/v1/wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['store']>>>
    }
  }
  'wishlist.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/wishlist/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wishlist_controller').default['destroy']>>>
    }
  }
  'account.show_profile': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['showProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['showProfile']>>>
    }
  }
  'account.update_profile': {
    methods: ["PUT"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateProfile']>>>
    }
  }
  'account.set_password': {
    methods: ["PUT"]
    pattern: '/api/v1/account/password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['setPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['setPassword']>>>
    }
  }
  'account.addresses': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/addresses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['addresses']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['addresses']>>>
    }
  }
  'account.store_address': {
    methods: ["POST"]
    pattern: '/api/v1/account/addresses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['storeAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['storeAddress']>>>
    }
  }
  'account.update_address': {
    methods: ["PUT"]
    pattern: '/api/v1/account/addresses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['updateAddress']>>>
    }
  }
  'account.destroy_address': {
    methods: ["DELETE"]
    pattern: '/api/v1/account/addresses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['destroyAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['destroyAddress']>>>
    }
  }
  'account.orders': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['orders']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['orders']>>>
    }
  }
  'account.show_order': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['showOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['showOrder']>>>
    }
  }
  'account.reviews': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/reviews'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['reviews']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['reviews']>>>
    }
  }
  'wallet.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/wallet'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['show']>>>
    }
  }
  'wallet.top_up': {
    methods: ["POST"]
    pattern: '/api/v1/account/wallet/topup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['topUp']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['topUp']>>>
    }
  }
  'wallet.withdraw': {
    methods: ["POST"]
    pattern: '/api/v1/account/wallet/withdraw'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['withdraw']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/wallet_controller').default['withdraw']>>>
    }
  }
  'checkout.place': {
    methods: ["POST"]
    pattern: '/api/v1/checkout/place'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/checkout_controller').default['place']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/checkout_controller').default['place']>>>
    }
  }
  'notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
    }
  }
  'notifications.mark_read': {
    methods: ["POST"]
    pattern: '/api/v1/notifications/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markRead']>>>
    }
  }
  'notifications.mark_all_read': {
    methods: ["POST"]
    pattern: '/api/v1/notifications/read-all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAllRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAllRead']>>>
    }
  }
  'seller.shop': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/shop'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['shop']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['shop']>>>
    }
  }
  'seller.update_shop': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/shop'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateShop']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateShop']>>>
    }
  }
  'seller.footer': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/footer'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['footer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['footer']>>>
    }
  }
  'seller.update_footer': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/footer'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateFooter']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateFooter']>>>
    }
  }
  'seller.listings': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/listings').listingsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['listings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['listings']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller.show_listing': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/listings/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['showListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['showListing']>>>
    }
  }
  'seller.store_listing': {
    methods: ["POST"]
    pattern: '/api/v1/seller/listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['storeListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['storeListing']>>>
    }
  }
  'seller.update_listing': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/listings/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateListing']>>>
    }
  }
  'seller.destroy_listing': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/listings/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['destroyListing']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['destroyListing']>>>
    }
  }
  'seller.orders': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/orders').ordersQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['orders']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['orders']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller.show_order': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['showOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['showOrder']>>>
    }
  }
  'seller.update_order_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/orders/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateOrderStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateOrderStatus']>>>
    }
  }
  'seller.update_order_tracking': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/orders/:id/tracking'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_detail').orderTrackingValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_detail').orderTrackingValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateOrderTracking']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['updateOrderTracking']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller.add_order_note': {
    methods: ["POST"]
    pattern: '/api/v1/seller/orders/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_detail').orderNoteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_detail').orderNoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['addOrderNote']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['addOrderNote']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller.create_order_refund': {
    methods: ["POST"]
    pattern: '/api/v1/seller/orders/:id/refunds'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order_detail').orderRefundValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order_detail').orderRefundValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['createOrderRefund']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['createOrderRefund']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller.destroy_order': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['destroyOrder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['destroyOrder']>>>
    }
  }
  'seller_reviews.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/reviews'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/reviews').reviewsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reviews.bulk_moderation': {
    methods: ["POST"]
    pattern: '/api/v1/seller/reviews/bulk-moderation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reviews').bulkReviewModerationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/reviews').bulkReviewModerationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['bulkModeration']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['bulkModeration']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reviews.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/reviews/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['show']>>>
    }
  }
  'seller_reviews.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/reviews/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reviews').updateReviewTextValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/reviews').updateReviewTextValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reviews.reply': {
    methods: ["POST"]
    pattern: '/api/v1/seller/reviews/:id/reply'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reviews').replyReviewValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/reviews').replyReviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['reply']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['reply']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reviews.set_moderation': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/reviews/:id/moderation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reviews').updateReviewModerationValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/reviews').updateReviewModerationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['setModeration']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reviews_controller').default['setModeration']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_questions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/questions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/questions').questionsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_questions.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/questions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['show']>>>
    }
  }
  'seller_questions.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/questions/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/questions').updateQuestionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/questions').updateQuestionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_questions.reply': {
    methods: ["POST"]
    pattern: '/api/v1/seller/questions/:id/reply'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/questions').replyQuestionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/questions').replyQuestionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['reply']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['reply']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_questions.clear_answer': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/questions/:id/answer'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['clearAnswer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['clearAnswer']>>>
    }
  }
  'seller_questions.set_verified': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/questions/:id/verified'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/questions').setQuestionVerifiedValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/questions').setQuestionVerifiedValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['setVerified']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['setVerified']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_questions.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/questions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_questions_controller').default['destroy']>>>
    }
  }
  'seller.payouts': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/payouts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['payouts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['payouts']>>>
    }
  }
  'seller.store_payout': {
    methods: ["POST"]
    pattern: '/api/v1/seller/payouts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['storePayout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['storePayout']>>>
    }
  }
  'seller.sales': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/sales'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['sales']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['sales']>>>
    }
  }
  'seller_transactions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/transactions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/transactions').transactionsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_transactions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_transactions_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_transactions.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/transactions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_transactions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_transactions_controller').default['show']>>>
    }
  }
  'seller_payments.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/payments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/seller_payments').sellerPaymentsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_payments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_payments_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_payments.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/payments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_payments_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_payments_controller').default['show']>>>
    }
  }
  'seller_settlements.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/settlements'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/settlements').settlementsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_settlements.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/settlements/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['show']>>>
    }
  }
  'seller_settlements.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/settlements'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/settlements').storeSettlementValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/settlements').storeSettlementValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_settlements.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/settlements/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/settlements').updateSettlementStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/settlements').updateSettlementStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settlements_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reconciliation.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/reconciliation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/reconciliation').reconciliationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reconciliation.resolve': {
    methods: ["POST"]
    pattern: '/api/v1/seller/reconciliation/resolve'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/reconciliation').resolveDiscrepancyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/reconciliation').resolveDiscrepancyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['resolve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['resolve']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reconciliation.unresolve': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/reconciliation/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['unresolve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reconciliation_controller').default['unresolve']>>>
    }
  }
  'seller_adjustments.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/adjustments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/adjustments').adjustmentsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_adjustments_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_adjustments_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_adjustments.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/adjustments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/adjustments').storeAdjustmentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/adjustments').storeAdjustmentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_adjustments_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_adjustments_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_reports.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/reports').reportsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_reports_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_reports_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categories.admin_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/categories').categoriesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['adminIndex']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['adminIndex']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categories.admin_show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['adminShow']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['adminShow']>>>
    }
  }
  'categories.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/category').storeCategoryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/category').storeCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categories.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/category').updateCategoryValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/category').updateCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'categories.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['destroy']>>>
    }
  }
  'deals.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/deals'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/deals_query').dealsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'deals.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/deals/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['show']>>>
    }
  }
  'deals.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/deals'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['store']>>>
    }
  }
  'deals.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/deals/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['update']>>>
    }
  }
  'deals.set_active': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/deals/:id/active'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['setActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['setActive']>>>
    }
  }
  'deals.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/deals/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/deals_controller').default['destroy']>>>
    }
  }
  'discount_codes.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/discount-codes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/promotions_query').discountCodesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'discount_codes.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/discount-codes/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['show']>>>
    }
  }
  'discount_codes.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/discount-codes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['store']>>>
    }
  }
  'discount_codes.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/discount-codes/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['update']>>>
    }
  }
  'discount_codes.set_active': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/discount-codes/:code/active'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['setActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['setActive']>>>
    }
  }
  'discount_codes.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/discount-codes/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/discount_codes_controller').default['destroy']>>>
    }
  }
  'content_promos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/content-promos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/promotions_query').contentPromosQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'content_promos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/content-promos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['show']>>>
    }
  }
  'content_promos.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/content-promos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['store']>>>
    }
  }
  'content_promos.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/content-promos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['update']>>>
    }
  }
  'content_promos.set_active': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/content-promos/:id/active'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['setActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['setActive']>>>
    }
  }
  'content_promos.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/content-promos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/content_promos_controller').default['destroy']>>>
    }
  }
  'seller_notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/notifications_query').notificationsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_notifications.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/notifications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['show']>>>
    }
  }
  'seller_notifications.users': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/notification-users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['users']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['users']>>>
    }
  }
  'seller_notifications.preview': {
    methods: ["POST"]
    pattern: '/api/v1/seller/notifications/preview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['preview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['preview']>>>
    }
  }
  'seller_notifications.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['store']>>>
    }
  }
  'seller_notifications.cancel': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/notifications/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['cancel']>>>
    }
  }
  'seller_notifications.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/notifications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_notifications_controller').default['destroy']>>>
    }
  }
  'seller_blog.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/blog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/blog_query').blogQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_blog.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/blog/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['show']>>>
    }
  }
  'seller_blog.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/blog'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').storeBlogValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').storeBlogValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_blog.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/blog/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').updateBlogValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').updateBlogValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_blog.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/blog/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').blogStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').blogStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_blog.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/blog/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_blog_controller').default['destroy']>>>
    }
  }
  'seller_pages.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pages_query').pagesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_pages.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['show']>>>
    }
  }
  'seller_pages.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/pages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/page').storePageValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/page').storePageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_pages.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/pages/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/page').updatePageValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/page').updatePageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_pages.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/pages/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/page').pageStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/page').pageStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_pages.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_pages_controller').default['destroy']>>>
    }
  }
  'seller_about.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/about'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_about_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_about_controller').default['show']>>>
    }
  }
  'seller_about.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/about'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/about').aboutValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/about').aboutValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_about_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_about_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_media.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/media'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/media_query').mediaQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_media.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/media'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['store']>>>
    }
  }
  'seller_media.register': {
    methods: ["POST"]
    pattern: '/api/v1/seller/media/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media').registerMediaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/media').registerMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_media.bulk_destroy': {
    methods: ["POST"]
    pattern: '/api/v1/seller/media/bulk-delete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media').bulkDeleteMediaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/media').bulkDeleteMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['bulkDestroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['bulkDestroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_media.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/media/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['show']>>>
    }
  }
  'seller_media.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/media/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/media').updateMediaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/media').updateMediaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_media.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/media/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_media_controller').default['destroy']>>>
    }
  }
  'seller_admins.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/admins'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admins').adminsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_admins.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/admins'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admins').storeAdminValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admins').storeAdminValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_admins.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/admins/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['show']>>>
    }
  }
  'seller_admins.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/admins/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admins').updateAdminValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admins').updateAdminValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_admins.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/admins/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admins').adminStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admins').adminStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_admins.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/admins/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_admins_controller').default['destroy']>>>
    }
  }
  'seller_roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/roles').rolesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_roles.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/roles').storeRoleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/roles').storeRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_roles.permissions': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/permissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['permissions']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['permissions']>>>
    }
  }
  'seller_roles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['show']>>>
    }
  }
  'seller_roles.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/roles').updateRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/roles').updateRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_roles.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_roles_controller').default['destroy']>>>
    }
  }
  'seller_system.summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/system'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_system_controller').default['summary']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_system_controller').default['summary']>>>
    }
  }
  'seller_audit.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/audit'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/audit').auditQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_audit_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_audit_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_audit.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/audit'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/audit').storeAuditValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/audit').storeAuditValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_audit_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_audit_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_settings.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settings_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settings_controller').default['show']>>>
    }
  }
  'seller_settings.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/settings'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/platform_settings').platformSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/platform_settings').platformSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_settings_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_settings_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_seo.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/seo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['show']>>>
    }
  }
  'seller_seo.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/seo'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seo_settings').seoSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/seo_settings').seoSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_seo.redirects_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/seo/redirects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsIndex']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsIndex']>>>
    }
  }
  'seller_seo.redirects_store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/seo/redirects'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seo_redirects').seoRedirectValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/seo_redirects').seoRedirectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsStore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsStore']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_seo.redirects_update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/seo/redirects/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seo_redirects').seoRedirectValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/seo_redirects').seoRedirectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsUpdate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsUpdate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_seo.redirects_destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/seo/redirects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsDestroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_seo_controller').default['redirectsDestroy']>>>
    }
  }
  'seller_navigation.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/navigation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_navigation_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_navigation_controller').default['show']>>>
    }
  }
  'seller_navigation.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/navigation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/navigation_settings').navigationSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/navigation_settings').navigationSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_navigation_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_navigation_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_marketing.summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/marketing'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/marketing').marketingSummaryQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_marketing_controller').default['summary']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_marketing_controller').default['summary']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/discounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/discount').discountsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.bulk_status': {
    methods: ["POST"]
    pattern: '/api/v1/seller/discounts/bulk-status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/discount').bulkDiscountStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/discount').bulkDiscountStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['bulkStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['bulkStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.bulk_destroy': {
    methods: ["POST"]
    pattern: '/api/v1/seller/discounts/bulk-delete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/discount').bulkDiscountDeleteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/discount').bulkDiscountDeleteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['bulkDestroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['bulkDestroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/discounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['show']>>>
    }
  }
  'seller_discounts.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/discounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/discount').storeDiscountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/discount').storeDiscountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/discounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/discount').updateDiscountValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/discount').updateDiscountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/discounts/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/discount').discountStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/discount').discountStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_discounts.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/discounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_discounts_controller').default['destroy']>>>
    }
  }
  'seller_campaigns.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/campaigns'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/campaign').campaignsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.bulk_status': {
    methods: ["POST"]
    pattern: '/api/v1/seller/campaigns/bulk-status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/campaign').bulkCampaignStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/campaign').bulkCampaignStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['bulkStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['bulkStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.bulk_destroy': {
    methods: ["POST"]
    pattern: '/api/v1/seller/campaigns/bulk-delete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/campaign').bulkCampaignDeleteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/campaign').bulkCampaignDeleteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['bulkDestroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['bulkDestroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/campaigns/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['show']>>>
    }
  }
  'seller_campaigns.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/campaigns'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/campaign').storeCampaignValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/campaign').storeCampaignValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/campaigns/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/campaign').updateCampaignValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/campaign').updateCampaignValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/campaigns/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/campaign').campaignStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/campaign').campaignStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_campaigns.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/campaigns/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_campaigns_controller').default['destroy']>>>
    }
  }
  'seller_banners.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/banners'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/banners_query').bannersQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_banners.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['show']>>>
    }
  }
  'seller_banners.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/banners'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/banner').storeBannerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/banner').storeBannerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_banners.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/banners/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/banner').updateBannerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/banner').updateBannerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_banners.set_active': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/banners/:id/active'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/banner').bannerActiveValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/banner').bannerActiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['setActive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['setActive']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_banners.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_banners_controller').default['destroy']>>>
    }
  }
  'seller_brands.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/brands'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/brand').brandsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_brands.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/brands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['show']>>>
    }
  }
  'seller_brands.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/brands'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/brand').storeBrandValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/brand').storeBrandValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_brands.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/brands/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/brand').updateBrandValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/brand').updateBrandValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_brands.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/brands/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/brand').brandStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/brand').brandStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_brands.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/brands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_brands_controller').default['destroy']>>>
    }
  }
  'seller_attributes.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/attributes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/attribute').attributesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_attributes.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/attributes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['show']>>>
    }
  }
  'seller_attributes.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/attributes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/attribute').storeAttributeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/attribute').storeAttributeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_attributes.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/attributes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/attribute').updateAttributeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/attribute').updateAttributeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_attributes.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/attributes/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/attribute').attributeStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/attribute').attributeStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_attributes.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/attributes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_attributes_controller').default['destroy']>>>
    }
  }
  'seller_warehouses.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/warehouses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/inventory').warehousesQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_warehouses.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/warehouses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['show']>>>
    }
  }
  'seller_warehouses.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/warehouses'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/inventory').storeWarehouseValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/inventory').storeWarehouseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_warehouses.update': {
    methods: ["PUT"]
    pattern: '/api/v1/seller/warehouses/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/inventory').updateWarehouseValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/inventory').updateWarehouseValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_warehouses.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/warehouses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_warehouses_controller').default['destroy']>>>
    }
  }
  'seller_inventory.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/inventory'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/inventory').inventoryQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_inventory_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_inventory_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_inventory.adjust': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/inventory/:productId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/inventory').adjustInventoryValidator)>>
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/inventory').adjustInventoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_inventory_controller').default['adjust']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_inventory_controller').default['adjust']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_movements.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/stock-movements'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/inventory').movementsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_movements_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_movements_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_movements.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/stock-movements'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/inventory').storeMovementValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/inventory').storeMovementValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_movements_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_movements_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_returns.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/returns'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/returns').returnsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_returns.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/returns/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['show']>>>
    }
  }
  'seller_returns.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/returns'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/returns').storeReturnValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/returns').storeReturnValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_returns.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/returns/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/returns').updateReturnStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/returns').updateReturnStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_returns_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_refunds.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/refunds'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/refunds').refundsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_refunds.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/refunds/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['show']>>>
    }
  }
  'seller_refunds.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/refunds'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/refunds').storeRefundValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/refunds').storeRefundValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_refunds.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/refunds/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/refunds').updateRefundStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/refunds').updateRefundStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_refunds_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_shipping.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/shipping'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/shipping').shippingMethodsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_shipping.store': {
    methods: ["POST"]
    pattern: '/api/v1/seller/shipping'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/shipping').createShippingMethodValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/shipping').createShippingMethodValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_shipping.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/shipping/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['show']>>>
    }
  }
  'seller_shipping.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/shipping/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/shipping').updateShippingMethodValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/shipping').updateShippingMethodValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_shipping.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/seller/shipping/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_shipping_controller').default['destroy']>>>
    }
  }
  'seller_customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customers').customersQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_customers.bulk_status': {
    methods: ["POST"]
    pattern: '/api/v1/seller/customers/bulk-status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers').bulkCustomerStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers').bulkCustomerStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['bulkStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['bulkStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_customers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['show']>>>
    }
  }
  'seller_customers.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/customers/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers').updateCustomerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers').updateCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'seller_customers.set_status': {
    methods: ["PATCH"]
    pattern: '/api/v1/seller/customers/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers').updateCustomerStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers').updateCustomerStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['setStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_customers_controller').default['setStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
