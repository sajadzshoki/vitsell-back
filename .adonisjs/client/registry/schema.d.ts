/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
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
  'seller.listings': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/listings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['listings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['listings']>>>
    }
  }
  'seller.orders': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['orders']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['orders']>>>
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
  'seller.reviews': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/seller/reviews'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['reviews']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['reviews']>>>
    }
  }
  'seller.reply_review': {
    methods: ["POST"]
    pattern: '/api/v1/seller/reviews/:id/reply'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['replyReview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/seller_controller').default['replyReview']>>>
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
}
