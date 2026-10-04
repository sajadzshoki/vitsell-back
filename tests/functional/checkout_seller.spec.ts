import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import Address from '#models/address'
import CartItem from '#models/cart_item'
import SellerShop from '#models/seller_shop'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import CheckoutService from '#services/checkout_service'
import SellerShippingMethod from '#models/seller_shipping_method'
import env from '#start/env'
import KavenegarService, { OtpUnavailableError } from '#services/kavenegar_service'
import ZarinpalService, { PaymentUnavailableError } from '#services/zarinpal_service'

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function makeProduct(id: string, price = 100_000) {
  return Product.updateOrCreate(
    { id },
    {
      id,
      title: `Test ${id}`,
      brand: 'Test',
      category: 'mobile',
      categoryLabel: 'موبایل',
      price,
      oldPrice: null,
      rating: 4.5,
      reviews: 0,
      image: '/images/mock/iphone16pro-desert.jpg',
      gallery: null,
      badge: null,
      colors: null,
      inStock: true,
      fastDelivery: false,
      shortDesc: 'short',
      shortName: id,
      description: 'desc',
      features: ['f1'],
      buyNotes: [{ icon: 'shield-check', text: 'اصالت' }],
      scores: null,
      specs: [{ key: 'مدل', value: id }],
      soldCount: 0,
      viewCount: 0,
    }
  )
}

async function makeSeller(phone: string, slug: string) {
  const user = await User.updateOrCreate(
    { phone },
    { phone, role: 'seller' }
  )
  const shop = await SellerShop.updateOrCreate(
    { userId: user.id },
    {
      userId: user.id,
      name: `Shop ${slug}`,
      slug,
      phone,
      email: `${slug}@test.local`,
      city: 'تهران',
      about: 'test',
      rating: 5,
      reviewCount: 0,
      joinDate: '1403/01/01',
    }
  )
  return { user, shop }
}

test.group('Checkout marketplace', (group) => {
  group.tap((t) => t.tags(['checkout']))

  test('creates buyer order and one SellerOrder per shop', async ({ assert }) => {
    const buyer = await User.updateOrCreate(
      { phone: '09190000001' },
      { phone: '09190000001', role: 'customer' }
    )
    const { shop: shop1 } = await makeSeller('09190000011', `s1-${Date.now()}`)
    const { shop: shop2 } = await makeSeller('09190000012', `s2-${Date.now()}`)

    const p1 = await makeProduct(`chk-a-${Date.now()}`, 200_000)
    const p2 = await makeProduct(`chk-b-${Date.now()}`, 300_000)

    await SellerListing.create({
      shopId: shop1.id,
      productId: p1.id,
      stock: 5,
      sold: 0,
      views: 0,
      status: 'active',
    })
    await SellerListing.create({
      shopId: shop2.id,
      productId: p2.id,
      stock: 5,
      sold: 0,
      views: 0,
      status: 'active',
    })

    await CartItem.query().where('user_id', buyer.id).delete()
    await CartItem.create({ userId: buyer.id, productId: p1.id, qty: 1 })
    await CartItem.create({ userId: buyer.id, productId: p2.id, qty: 1 })

    const address = await Address.create({
      id: `addr-${Date.now()}`,
      userId: buyer.id,
      title: 'خانه',
      fullName: 'تست',
      phone: buyer.phone,
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان تست',
      postalCode: '1234567890',
      isDefault: true,
    })

    const checkout = new CheckoutService()
    const { order } = await checkout.place(buyer, {
      addressId: address.id,
      shippingMethod: 'pickup',
      paymentMethod: 'cod',
    })

    const sellerOrders = await SellerOrder.query().where('buyer_order_id', order.id)
    assert.lengthOf(sellerOrders, 2)
    assert.equal(new Set(sellerOrders.map((o) => o.shopId)).size, 2)

    const listing1 = await SellerListing.query()
      .where('shop_id', shop1.id)
      .where('product_id', p1.id)
      .firstOrFail()
    assert.equal(listing1.stock, 4)
    assert.equal(listing1.sold, 1)
  })

  test('stores configured shipping cost on the buyer order', async ({ assert }) => {
    const buyer = await User.updateOrCreate(
      { phone: '09190000061' },
      { phone: '09190000061', role: 'customer' }
    )
    const { shop } = await makeSeller('09190000062', `ship-${Date.now()}`)
    const product = await makeProduct(`ship-p-${Date.now()}`, 50_000)

    await SellerListing.create({
      shopId: shop.id,
      productId: product.id,
      stock: 5,
      sold: 0,
      views: 0,
      status: 'active',
    })

    await CartItem.query().where('user_id', buyer.id).delete()
    await CartItem.create({ userId: buyer.id, productId: product.id, qty: 1 })

    const address = await Address.create({
      id: `addr-ship-${Date.now()}`,
      userId: buyer.id,
      title: 'خانه',
      fullName: 'تست',
      phone: buyer.phone,
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان تست',
      postalCode: '1234567890',
      isDefault: true,
    })

    const method = await SellerShippingMethod.create({
      id: `ship-test-${Date.now()}`,
      name: 'پیک تست',
      carrier: 'تست',
      estimatedDays: '۱ روز',
      baseCost: 77_000,
      status: 'active',
      sortOrder: 99,
    })

    const checkout = new CheckoutService()
    const { order, total } = await checkout.place(buyer, {
      addressId: address.id,
      shippingMethod: method.id,
      paymentMethod: 'cod',
    })

    assert.equal(Number(order.shippingCost), 77_000)
    assert.equal(Number(order.total), 50_000 + 77_000)
    assert.equal(total, Number(order.total))
    const json = order.toShopOrderJSON()
    assert.equal(json.shippingCost, 77_000)
  })

  test('rejects second buy when stock is 1', async ({ assert }) => {
    const buyer1 = await User.updateOrCreate(
      { phone: '09190000021' },
      { phone: '09190000021', role: 'customer' }
    )
    const buyer2 = await User.updateOrCreate(
      { phone: '09190000022' },
      { phone: '09190000022', role: 'customer' }
    )
    const { shop } = await makeSeller('09190000023', `stock-${Date.now()}`)
    const product = await makeProduct(`stock-1-${Date.now()}`, 150_000)

    await SellerListing.create({
      shopId: shop.id,
      productId: product.id,
      stock: 1,
      sold: 0,
      views: 0,
      status: 'active',
    })

    for (const buyer of [buyer1, buyer2]) {
      await CartItem.query().where('user_id', buyer.id).delete()
      await CartItem.create({ userId: buyer.id, productId: product.id, qty: 1 })
      await Address.updateOrCreate(
        { id: `addr-${buyer.id}` },
        {
          id: `addr-${buyer.id}`,
          userId: buyer.id,
          title: 'خانه',
          fullName: 'تست',
          phone: buyer.phone,
          province: 'تهران',
          city: 'تهران',
          address: 'آدرس',
          postalCode: '1234567890',
          isDefault: true,
        }
      )
    }

    const checkout = new CheckoutService()
    await checkout.place(buyer1, {
      addressId: `addr-${buyer1.id}`,
      shippingMethod: 'pickup',
      paymentMethod: 'cod',
    })

    await assert.rejects(async () => {
      await checkout.place(buyer2, {
        addressId: `addr-${buyer2.id}`,
        shippingMethod: 'pickup',
        paymentMethod: 'cod',
      })
    })
  })
})

test.group('Seller authorization', () => {
  test('customer role is rejected on /seller/*', async ({ client }) => {
    const customer = await User.updateOrCreate(
      { phone: '09190000031' },
      { phone: '09190000031', role: 'customer' }
    )
    const token = await bearerFor(customer)
    const response = await client
      .get('/api/v1/seller/shop')
      .header('Authorization', `Bearer ${token}`)
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })

  test('seller A cannot PATCH B listing status', async ({ client, assert }) => {
    const { user: sellerA, shop: shopA } = await makeSeller(
      '09190000041',
      `sa-${Date.now()}`
    )
    const { shop: shopB } = await makeSeller('09190000042', `sb-${Date.now()}`)
    const product = await makeProduct(`own-${Date.now()}`)

    await SellerListing.create({
      shopId: shopB.id,
      productId: product.id,
      stock: 3,
      sold: 0,
      views: 0,
      status: 'active',
    })

    // Ensure A has a listing of their own so shop middleware passes
    const own = await makeProduct(`own-a-${Date.now()}`)
    await SellerListing.create({
      shopId: shopA.id,
      productId: own.id,
      stock: 1,
      sold: 0,
      views: 0,
      status: 'active',
    })

    const token = await bearerFor(sellerA)
    const response = await client
      .patch(`/api/v1/seller/listings/${product.id}`)
      .header('Authorization', `Bearer ${token}`)
      .header('Accept', 'application/json')
      .json({ status: 'inactive' })

    response.assertStatus(404)

    const still = await SellerListing.query()
      .where('shop_id', shopB.id)
      .where('product_id', product.id)
      .firstOrFail()
    assert.equal(still.status, 'active')
  })

  test('storeListing returns 403 when product owned by another shop', async ({
    client,
  }) => {
    const { user: sellerA } = await makeSeller('09190000051', `own403a-${Date.now()}`)
    const { shop: shopB } = await makeSeller('09190000052', `own403b-${Date.now()}`)
    const product = await makeProduct(`foreign-${Date.now()}`)
    await SellerListing.create({
      shopId: shopB.id,
      productId: product.id,
      stock: 2,
      sold: 0,
      views: 0,
      status: 'active',
    })

    const token = await bearerFor(sellerA)
    const response = await client
      .post('/api/v1/seller/listings')
      .header('Authorization', `Bearer ${token}`)
      .header('Accept', 'application/json')
      .json({
        stock: 1,
        product: {
          id: product.id,
          title: product.title,
          brand: product.brand,
          category: product.category,
          price: product.price,
          image: product.image,
        },
      })

    response.assertStatus(403)
  })
})

test.group('Fail-closed mocks', () => {
  test('Zarinpal mock path works only when ALLOW_PAYMENT_MOCK is enabled (non-prod)', async ({
    assert,
  }) => {
    const svc = new ZarinpalService()
    const allow =
      env.get('NODE_ENV') !== 'production' && env.get('ALLOW_PAYMENT_MOCK') === true
    if (env.get('ZARINPAL_MERCHANT_ID')) {
      return
    }
    if (allow) {
      const result = await svc.requestPayment({
        amountRial: 10000,
        description: 'test',
      })
      assert.isTrue(result.authority.startsWith('SANDBOX'))
    } else {
      await assert.rejects(
        async () => svc.requestPayment({ amountRial: 10000, description: 'test' }),
        PaymentUnavailableError
      )
    }
  })

  test('OTP mock path works only when ALLOW_OTP_MOCK is enabled (non-prod)', async ({
    assert,
  }) => {
    const svc = new KavenegarService()
    const allow =
      env.get('NODE_ENV') !== 'production' && env.get('ALLOW_OTP_MOCK') === true
    if (env.get('KAVENEGAR_API_KEY')) {
      return
    }
    if (allow) {
      const result = await svc.sendOtp('09121234567', '12345')
      assert.isTrue(result.mocked)
    } else {
      await assert.rejects(async () => svc.sendOtp('09121234567', '12345'), OtpUnavailableError)
    }
  })
})

test.group('Notifications auth', () => {
  test('notifications require auth', async ({ client }) => {
    const response = await client
      .get('/api/v1/notifications')
      .header('Accept', 'application/json')
    response.assertStatus(401)
  })
})
