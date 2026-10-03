import { test } from '@japa/runner'
import Order from '#models/order'
import SellerOrder from '#models/seller_order'
import SellerRefund from '#models/seller_refund'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function seedRefundOrder() {
  const stamp = Date.now()
  const suffix = String(stamp).slice(-8)
  const buyerPhone = `0919${suffix}`.slice(0, 11)
  const sellerPhone = `0918${suffix}`.slice(0, 11)
  const buyer = await User.updateOrCreate(
    { phone: buyerPhone },
    { phone: buyerPhone, role: 'customer' }
  )
  const sellerUser = await User.updateOrCreate(
    { phone: sellerPhone },
    { phone: sellerPhone, role: 'seller' }
  )
  const shop = await SellerShop.updateOrCreate(
    { userId: sellerUser.id },
    {
      userId: sellerUser.id,
      name: 'Refund Shop',
      slug: `refund-shop-${stamp}`,
      phone: sellerUser.phone,
      email: `refund-${stamp}@test.local`,
      city: 'تهران',
      about: 'test',
      rating: 5,
      reviewCount: 0,
      joinDate: '1403/01/01',
    }
  )

  const buyerOrder = await Order.create({
    id: `BO-RF-${stamp}`,
    userId: buyer.id,
    date: '1403/01/01',
    status: 'processing',
    items: [{ productId: 'p1', qty: 1, price: 200_000 }],
    total: 200_000,
    shippingMethod: 'پیک',
    paymentMethod: 'آنلاین',
    address: {
      id: 'a1',
      title: 'خانه',
      fullName: 'خریدار تست',
      phone: buyer.phone,
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان تست',
      postalCode: '1234567890',
    },
    discountCode: null,
    discountAmount: 0,
    shippingCost: 0,
  })

  const sellerOrder = await SellerOrder.create({
    id: `SO-RF-${stamp}`,
    shopId: shop.id,
    buyerOrderId: buyerOrder.id,
    date: '1403/01/01',
    dateKey: '1403-01-01',
    status: 'new',
    customerName: 'خریدار تست',
    customerPhone: buyer.phone,
    city: 'تهران',
    address: {
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان تست',
      postalCode: '1234567890',
    },
    items: [{ productId: 'p1', qty: 1, price: 200_000 }],
    total: 200_000,
    shippingMethod: 'پیک',
    paymentMethod: 'آنلاین',
    note: null,
  })

  return { buyer, sellerOrder }
}

test.group('Seller refund wallet credit', (group) => {
  group.tap((t) => t.tags(['refunds', 'wallet']))

  test('completed refund credits buyer wallet once', async ({ client, assert }) => {
    const admin = await User.updateOrCreate(
      { phone: '09193330999' },
      { phone: '09193330999', role: 'admin' }
    )
    const token = await bearerFor(admin)
    const { buyer, sellerOrder } = await seedRefundOrder()

    const created = await client
      .post('/api/v1/seller/refunds')
      .bearerToken(token)
      .json({
        orderId: sellerOrder.id,
        amount: 50_000,
        reason: 'مرجوعی تست',
        status: 'completed',
      })

    created.assertStatus(201)

    const wallet = await Wallet.query().where('user_id', buyer.id).firstOrFail()
    assert.equal(Number(wallet.balance), 50_000)

    const txs = await WalletTransaction.query()
      .where('user_id', buyer.id)
      .where('type', 'refund')
      .where('ref_id', created.body().id)
    assert.lengthOf(txs, 1)
    assert.equal(Number(txs[0].signedAmount), 50_000)

    await client.get('/api/v1/seller/refunds').bearerToken(token)

    await wallet.refresh()
    assert.equal(Number(wallet.balance), 50_000)
    const again = await WalletTransaction.query()
      .where('user_id', buyer.id)
      .where('type', 'refund')
      .where('ref_id', created.body().id)
    assert.lengthOf(again, 1)
  })

  test('pending refund credits wallet when marked completed', async ({ client, assert }) => {
    const admin = await User.updateOrCreate(
      { phone: '09193330999' },
      { phone: '09193330999', role: 'admin' }
    )
    const token = await bearerFor(admin)
    const { buyer, sellerOrder } = await seedRefundOrder()

    const created = await client
      .post('/api/v1/seller/refunds')
      .bearerToken(token)
      .json({
        orderId: sellerOrder.id,
        amount: 30_000,
        reason: 'در انتظار',
        status: 'pending',
      })
    created.assertStatus(201)

    const before = Number(
      (await Wallet.query().where('user_id', buyer.id).first())?.balance || 0
    )
    assert.equal(before, 0)

    const patched = await client
      .patch(`/api/v1/seller/refunds/${created.body().id}/status`)
      .bearerToken(token)
      .json({ status: 'completed' })
    patched.assertStatus(200)

    const wallet = await Wallet.query().where('user_id', buyer.id).firstOrFail()
    assert.equal(Number(wallet.balance), 30_000)
  })

  test('index backfills wallet for already completed refunds', async ({ client, assert }) => {
    const admin = await User.updateOrCreate(
      { phone: '09193330999' },
      { phone: '09193330999', role: 'admin' }
    )
    const token = await bearerFor(admin)
    const { buyer, sellerOrder } = await seedRefundOrder()

    const refundId = `RF-OLD-${Date.now()}`
    await SellerRefund.create({
      id: refundId,
      orderId: sellerOrder.id,
      returnId: null,
      customerName: sellerOrder.customerName,
      status: 'completed',
      amount: 40_000,
      orderTotal: 200_000,
      alreadyRefunded: 0,
      reason: 'قدیمی',
      transactionId: '',
      items: [],
    })

    const listed = await client.get('/api/v1/seller/refunds?all=1').bearerToken(token)
    listed.assertStatus(200)

    const wallet = await Wallet.query().where('user_id', buyer.id).firstOrFail()
    assert.equal(Number(wallet.balance), 40_000)
    const txs = await WalletTransaction.query()
      .where('user_id', buyer.id)
      .where('ref_id', refundId)
    assert.lengthOf(txs, 1)
  })
})
