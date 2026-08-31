import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ProductsController = () => import('#controllers/products_controller')
const CartController = () => import('#controllers/cart_controller')
const WishlistController = () => import('#controllers/wishlist_controller')
const AccountController = () => import('#controllers/account_controller')
const CheckoutController = () => import('#controllers/checkout_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const ContentController = () => import('#controllers/content_controller')
const SellerController = () => import('#controllers/seller_controller')
const WalletController = () => import('#controllers/wallet_controller')
const UploadController = () => import('#controllers/upload_controller')
const ActivityController = () => import('#controllers/activity_controller')
const DealsController = () => import('#controllers/deals_controller')
const SellerNotificationsController = () => import('#controllers/seller_notifications_controller')
const DiscountCodesController = () => import('#controllers/discount_codes_controller')
const ContentPromosController = () => import('#controllers/content_promos_controller')

router.get('/', () => {
  return { name: 'digishop-api', version: '1' }
})

router.get('/uploads/:file', [UploadController, 'show'])

router
  .group(() => {
    router
      .group(() => {
        router.post('otp/request', [AuthController, 'requestOtp'])
        router.post('otp/verify', [AuthController, 'verifyOtp'])
        router.post('check', [AuthController, 'checkPhone'])
        router.post('login', [AuthController, 'loginWithPassword'])
        router.post('password/reset', [AuthController, 'resetPassword'])
        router.post('admin/check', [AuthController, 'adminCheckPhone'])
        router.post('admin/login', [AuthController, 'adminLogin'])
        router.get('me', [AuthController, 'me']).use(middleware.auth())
        router.post('logout', [AuthController, 'logout']).use(middleware.auth())
      })
      .prefix('auth')

    router.get('categories', [CategoriesController, 'index'])
    router.get('categories/:id', [CategoriesController, 'show'])
    router.get('category-pages/:id', [CategoriesController, 'pageMeta'])

    router.get('products', [ProductsController, 'index'])
    router.get('products/:id', [ProductsController, 'show'])
    router.get('products/:id/reviews', [ProductsController, 'reviews'])
    router.post('products/:id/reviews', [ProductsController, 'storeReview']).use(middleware.auth())
    router.get('products/:id/questions', [ProductsController, 'questions'])
    router
      .post('products/:id/questions', [ProductsController, 'storeQuestion'])
      .use(middleware.auth())

    router.post('upload', [UploadController, 'store']).use(middleware.auth())

    router.get('home', [ContentController, 'home'])
    router.get('site', [ContentController, 'site'])
    router.get('recommendations', [ActivityController, 'recommendations'])
    router
      .group(() => {
        router.post('/', [ActivityController, 'store'])
        router.post('/sync', [ActivityController, 'sync'])
      })
      .prefix('activity')
      .use(middleware.auth())
    router.get('locations', [ContentController, 'locations'])
    router.get('compare/templates/:category', [ContentController, 'compareTemplates'])
    router.get('footer', [ContentController, 'footer'])
    router.get('discount-codes', [ContentController, 'discountCodes'])
    router.get('blog', [ContentController, 'blogIndex'])
    router.get('blog/:id', [ContentController, 'blogShow'])
    router.get('static-pages/:id', [ContentController, 'staticPage'])

    router.get('payments/zarinpal/callback', [CheckoutController, 'zarinpalCallback'])
    router.get('payments/zarinpal/wallet-callback', [WalletController, 'zarinpalCallback'])

    router
      .group(() => {
        router.get('/', [CartController, 'index'])
        router.post('/', [CartController, 'store'])
        router.patch('/:productId', [CartController, 'update'])
        router.delete('/:productId', [CartController, 'destroy'])
        router.delete('/', [CartController, 'clear'])
      })
      .prefix('cart')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/', [WishlistController, 'index'])
        router.post('/', [WishlistController, 'store'])
        router.delete('/:productId', [WishlistController, 'destroy'])
      })
      .prefix('wishlist')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('profile', [AccountController, 'showProfile'])
        router.put('profile', [AccountController, 'updateProfile'])
        router.put('password', [AccountController, 'setPassword'])
        router.get('addresses', [AccountController, 'addresses'])
        router.post('addresses', [AccountController, 'storeAddress'])
        router.put('addresses/:id', [AccountController, 'updateAddress'])
        router.delete('addresses/:id', [AccountController, 'destroyAddress'])
        router.get('orders', [AccountController, 'orders'])
        router.get('orders/:id', [AccountController, 'showOrder'])
        router.get('reviews', [AccountController, 'reviews'])
        router.get('wallet', [WalletController, 'show'])
        router.post('wallet/topup', [WalletController, 'topUp'])
        router.post('wallet/withdraw', [WalletController, 'withdraw'])
      })
      .prefix('account')
      .use(middleware.auth())

    router.post('checkout/place', [CheckoutController, 'place']).use(middleware.auth())

    router
      .group(() => {
        router.get('/', [NotificationsController, 'index'])
        router.post('/:id/read', [NotificationsController, 'markRead'])
        router.post('/read-all', [NotificationsController, 'markAllRead'])
      })
      .prefix('notifications')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('shop', [SellerController, 'shop'])
        router.put('shop', [SellerController, 'updateShop'])
        router.get('footer', [SellerController, 'footer'])
        router.put('footer', [SellerController, 'updateFooter'])
        router.get('listings', [SellerController, 'listings'])
        router.get('listings/:productId', [SellerController, 'showListing'])
        router.post('listings', [SellerController, 'storeListing'])
        router.patch('listings/:productId', [SellerController, 'updateListing'])
        router.get('orders', [SellerController, 'orders'])
        router.get('orders/:id', [SellerController, 'showOrder'])
        router.patch('orders/:id/status', [SellerController, 'updateOrderStatus'])
        router.get('reviews', [SellerController, 'reviews'])
        router.post('reviews/:id/reply', [SellerController, 'replyReview'])
        router.get('questions', [SellerController, 'questions'])
        router.post('questions/:id/reply', [SellerController, 'replyQuestion'])
        router.delete('questions/:id/answer', [SellerController, 'clearQuestionAnswer'])
        router.patch('questions/:id/verified', [SellerController, 'setQuestionVerified'])
        router.delete('questions/:id', [SellerController, 'destroyQuestion'])
        router.get('payouts', [SellerController, 'payouts'])
        router.post('payouts', [SellerController, 'storePayout'])
        router.get('sales', [SellerController, 'sales'])
        router.get('categories', [CategoriesController, 'adminIndex'])
        router.get('categories/:id', [CategoriesController, 'adminShow'])
        router.post('categories', [CategoriesController, 'store'])
        router.put('categories/:id', [CategoriesController, 'update'])
        router.delete('categories/:id', [CategoriesController, 'destroy'])
        router.get('deals', [DealsController, 'index'])
        router.get('deals/:id', [DealsController, 'show'])
        router.post('deals', [DealsController, 'store'])
        router.put('deals/:id', [DealsController, 'update'])
        router.patch('deals/:id/active', [DealsController, 'setActive'])
        router.delete('deals/:id', [DealsController, 'destroy'])

        router.get('discount-codes', [DiscountCodesController, 'index'])
        router.get('discount-codes/:code', [DiscountCodesController, 'show'])
        router.post('discount-codes', [DiscountCodesController, 'store'])
        router.put('discount-codes/:code', [DiscountCodesController, 'update'])
        router.patch('discount-codes/:code/active', [DiscountCodesController, 'setActive'])
        router.delete('discount-codes/:code', [DiscountCodesController, 'destroy'])

        router.get('content-promos', [ContentPromosController, 'index'])
        router.get('content-promos/:id', [ContentPromosController, 'show'])
        router.post('content-promos', [ContentPromosController, 'store'])
        router.put('content-promos/:id', [ContentPromosController, 'update'])
        router.patch('content-promos/:id/active', [ContentPromosController, 'setActive'])
        router.delete('content-promos/:id', [ContentPromosController, 'destroy'])

        router.get('notifications', [SellerNotificationsController, 'index'])
        router.get('notification-users', [SellerNotificationsController, 'users'])
        router.post('notifications/preview', [SellerNotificationsController, 'preview'])
        router.post('notifications', [SellerNotificationsController, 'store'])
        router.delete('notifications/:id', [SellerNotificationsController, 'destroy'])
      })
      .prefix('seller')
      .use(middleware.auth())
      .use(middleware.admin())
  })
  .prefix('/api/v1')
