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
const ContactController = () => import('#controllers/contact_controller')

router.get('/', () => {
  return { name: 'digishop-api', version: '1' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('otp/request', [AuthController, 'requestOtp'])
        router.post('otp/verify', [AuthController, 'verifyOtp'])
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
    router.get('products/:id/questions', [ProductsController, 'questions'])
    router
      .post('products/:id/reviews', [ProductsController, 'storeReview'])
      .use(middleware.auth())
    router
      .post('products/:id/questions', [ProductsController, 'storeQuestion'])
      .use(middleware.auth())

    router.get('home', [ContentController, 'home'])
    router.get('locations', [ContentController, 'locations'])
    router.get('compare/templates/:category', [ContentController, 'compareTemplates'])
    router.get('footer', [ContentController, 'footer'])
    router.get('discount-codes', [ContentController, 'discountCodes'])
    router.get('blog', [ContentController, 'blogIndex'])
    router.get('blog/:id', [ContentController, 'blogShow'])
    router.get('static-pages/:id', [ContentController, 'staticPage'])
    router.post('contact', [ContactController, 'store'])

    router.get('payments/zarinpal/callback', [CheckoutController, 'zarinpalCallback'])

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
        router.get('addresses', [AccountController, 'addresses'])
        router.post('addresses', [AccountController, 'storeAddress'])
        router.put('addresses/:id', [AccountController, 'updateAddress'])
        router.delete('addresses/:id', [AccountController, 'destroyAddress'])
        router.get('orders', [AccountController, 'orders'])
        router.get('orders/:id', [AccountController, 'showOrder'])
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
        router.get('listings', [SellerController, 'listings'])
        router.post('listings', [SellerController, 'storeListing'])
        router.patch('listings/:productId', [SellerController, 'updateListingStatus'])
        router.get('orders', [SellerController, 'orders'])
        router.get('orders/:id', [SellerController, 'showOrder'])
        router.patch('orders/:id/status', [SellerController, 'updateOrderStatus'])
        router.get('reviews', [SellerController, 'reviews'])
        router.post('reviews/:id/reply', [SellerController, 'replyReview'])
        router.get('payouts', [SellerController, 'payouts'])
        router.post('payouts', [SellerController, 'requestPayout'])
        router.get('sales', [SellerController, 'sales'])
      })
      .prefix('seller')
      .use([middleware.auth(), middleware.seller()])
  })
  .prefix('/api/v1')
