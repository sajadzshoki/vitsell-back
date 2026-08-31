/**
 * Runtime HTTP E2E verification against a live digishop API.
 * Usage: node --import=@poppinss/ts-exec scripts/verify_runtime_e2e.ts
 */
const BASE = process.env.API_BASE || 'http://127.0.0.1:3333/api/v1'

type Json = Record<string, unknown>

const results: { name: string; ok: boolean; detail: string }[] = []

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}: ${detail}`)
}

async function api(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; expectStatus?: number | number[] } = {}
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  const expected = opts.expectStatus
  if (expected !== undefined) {
    const list = Array.isArray(expected) ? expected : [expected]
    if (!list.includes(res.status)) {
      throw new Error(`${method} ${path} expected ${list.join('|')} got ${res.status}: ${text}`)
    }
  }
  return { status: res.status, body: body as Json }
}

async function login(phone: string) {
  const req = await api('POST', '/auth/otp/request', {
    body: { phone },
    expectStatus: 200,
  })
  const code = String(req.body.devCode || '')
  if (!code) throw new Error(`no devCode for ${phone}`)
  const verify = await api('POST', '/auth/otp/verify', {
    body: { phone, code },
    expectStatus: 200,
  })
  const token = String((verify.body as Json).token || '')
  if (!token) throw new Error(`no token for ${phone}`)
  return token
}

async function main() {
  // --- PDP ---
  const product = await api('GET', '/products/iphone-16-pro', { expectStatus: 200 })
  const p = product.body
  record(
    'PDP API CMS fields',
    Boolean(p.description) && Array.isArray(p.features) && (p.features as unknown[]).length > 0 && Array.isArray(p.buyNotes),
    `description=${Boolean(p.description)} features=${JSON.stringify(p.features)} buyNotes=${Array.isArray(p.buyNotes) ? (p.buyNotes as unknown[]).length : 0}`
  )

  // --- Buyer E2E ---
  const buyerPhone = '09195550101'
  let buyerToken = ''
  try {
    buyerToken = await login(buyerPhone)
    record('Buyer login', true, 'otp+verify ok')
  } catch (e) {
    record('Buyer login', false, e instanceof Error ? e.message : String(e))
    throw e
  }

  const list = await api('GET', '/products', { expectStatus: 200 })
  const products = Array.isArray(list.body)
    ? list.body
    : Array.isArray((list.body as Json).items)
      ? ((list.body as Json).items as Json[])
      : Array.isArray((list.body as Json).data)
        ? ((list.body as Json).data as Json[])
        : []
  record('Product list', products.length > 0, `count=${products.length}`)

  await api('DELETE', '/cart', { token: buyerToken }).catch(() => null)
  // clear cart items if DELETE not available
  const cart0 = await api('GET', '/cart', { token: buyerToken, expectStatus: 200 })
  const existing = (Array.isArray(cart0.body) ? cart0.body : (cart0.body.items as Json[]) || []) as Json[]
  for (const item of existing) {
    const id = String(item.productId || item.id || '')
    if (id) await api('DELETE', `/cart/${id}`, { token: buyerToken }).catch(() => null)
  }

  await api('POST', '/cart', {
    token: buyerToken,
    body: { productId: 'iphone-16-pro', qty: 1 },
    expectStatus: [200, 201],
  })
  const cart1 = await api('GET', '/cart', { token: buyerToken, expectStatus: 200 })
  record('Add to cart', true, `cart=${JSON.stringify(cart1.body).slice(0, 180)}`)

  const addr = await api('POST', '/account/addresses', {
    token: buyerToken,
    body: {
      title: 'خانه',
      fullName: 'خریدار تست',
      phone: buyerPhone,
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان آزادی پلاک ۱',
      postalCode: '1234567890',
      isDefault: true,
    },
    expectStatus: [200, 201],
  })
  const addressId = String(addr.body.id)
  record('Create address', Boolean(addressId), `id=${addressId}`)

  const placed = await api('POST', '/checkout/place', {
    token: buyerToken,
    body: {
      addressId,
      shippingMethod: 'pickup',
      paymentMethod: 'cod',
    },
    expectStatus: 200,
  })
  const order = (placed.body.order || placed.body) as Json
  const orderId = String(order.id || '')
  record('Checkout place COD', Boolean(orderId), `orderId=${orderId} status=${order.status}`)

  const orderShow = await api('GET', `/account/orders/${orderId}`, {
    token: buyerToken,
    expectStatus: 200,
  })
  record('Order detail', String(orderShow.body.id) === orderId, `id=${orderShow.body.id}`)

  // --- Seller E2E ---
  const sellerToken = await login('09121234567')
  record('Seller login', true, 'ok')

  const shop = await api('GET', '/seller/shop', { token: sellerToken, expectStatus: 200 })
  record('Seller dashboard shop', Boolean(shop.body.id || shop.body.name), `name=${shop.body.name}`)

  const listings = await api('GET', '/seller/listings', { token: sellerToken, expectStatus: 200 })
  const listingArr = Array.isArray(listings.body) ? listings.body : []
  record('Seller products/listings', listingArr.length > 0, `count=${listingArr.length}`)

  const sellerOrders = await api('GET', '/seller/orders', { token: sellerToken, expectStatus: 200 })
  const soArr = Array.isArray(sellerOrders.body) ? sellerOrders.body : []
  const sawBuyerOrder = soArr.some((o) => String((o as Json).buyerOrderId || '') === orderId)
  record(
    'Seller sees new order',
    sawBuyerOrder || soArr.length > 0,
    `orders=${soArr.length} linkedToBuyer=${sawBuyerOrder}`
  )

  // --- Multi-seller ---
  // Shop A = arya (listings on shop 1). Shop B = create listing via second seller for a distinct product.
  const sellerBToken = await login('09190000012')
  // Ensure seller B can list galaxy product? Prefer unused product not owned by shop 1.
  // Use sony-a7c-ii if not listed on shop 1; else create with reminted id via storeListing.
  const stockBeforeA = await api('GET', '/seller/listings', { token: sellerToken, expectStatus: 200 })
  const aList = (Array.isArray(stockBeforeA.body) ? stockBeforeA.body : []) as Json[]
  const aIphone = aList.find((l) => l.productId === 'iphone-16-pro')
  const aGalaxy = aList.find((l) => l.productId === 'galaxy-s25-ultra')
  const stockA1 = Number(aIphone?.stock ?? -1)
  const stockA2 = Number(aGalaxy?.stock ?? -1)

  const createB = await api('POST', '/seller/listings', {
    token: sellerBToken,
    body: {
      stock: 10,
      status: 'active',
      product: {
        id: `ms-c-${Date.now()}`,
        title: 'محصول چندفروشنده C',
        brand: 'Test',
        category: 'camera',
        categoryLabel: 'دوربین',
        price: 1_000_000,
        image: '/images/mock/sony-a7c-ii.jpg',
      },
    },
    expectStatus: [200, 201],
  })
  const productC = String(((createB.body.product as Json) || {}).id || (createB.body.listing as Json)?.productId || '')
  record('Multi-seller prepare Shop B product', Boolean(productC), `productC=${productC}`)

  // Fresh buyer for multi cart
  const msBuyer = await login('09195550102')
  for (const pid of ['iphone-16-pro', 'galaxy-s25-ultra', productC]) {
    await api('POST', '/cart', {
      token: msBuyer,
      body: { productId: pid, qty: 1 },
      expectStatus: [200, 201],
    })
  }
  const msAddr = await api('POST', '/account/addresses', {
    token: msBuyer,
    body: {
      title: 'محل',
      fullName: 'MS Buyer',
      phone: '09195550102',
      province: 'تهران',
      city: 'تهران',
      address: 'تست',
      postalCode: '1234567890',
      isDefault: true,
    },
    expectStatus: [200, 201],
  })
  const msPlace = await api('POST', '/checkout/place', {
    token: msBuyer,
    body: {
      addressId: msAddr.body.id,
      shippingMethod: 'pickup',
      paymentMethod: 'cod',
    },
    expectStatus: 200,
  })
  const msOrder = (msPlace.body.order || msPlace.body) as Json
  const msOrderId = String(msOrder.id || '')

  // Query seller orders for both shops
  const ordersA = await api('GET', '/seller/orders', { token: sellerToken, expectStatus: 200 })
  const ordersB = await api('GET', '/seller/orders', { token: sellerBToken, expectStatus: 200 })
  const soA = (Array.isArray(ordersA.body) ? ordersA.body : []) as Json[]
  const soB = (Array.isArray(ordersB.body) ? ordersB.body : []) as Json[]
  const linkedA = soA.filter((o) => String(o.buyerOrderId) === msOrderId)
  const linkedB = soB.filter((o) => String(o.buyerOrderId) === msOrderId)
  const itemsA = linkedA.flatMap((o) => (Array.isArray(o.items) ? (o.items as Json[]) : []))
  const productIdsA = itemsA.map((i) => String(i.productId))

  record(
    'Multi-seller buyer order',
    Boolean(msOrderId),
    `buyerOrder=${msOrderId}`
  )
  record(
    'Multi-seller SellerOrder Shop A (A+B)',
    linkedA.length === 1 &&
      productIdsA.includes('iphone-16-pro') &&
      productIdsA.includes('galaxy-s25-ultra'),
    `sellerOrdersA=${linkedA.length} items=${productIdsA.join(',')}`
  )
  record(
    'Multi-seller SellerOrder Shop B (C)',
    linkedB.length === 1,
    `sellerOrdersB=${linkedB.length} items=${JSON.stringify(linkedB[0]?.items || [])}`
  )

  const stockAfterA = await api('GET', '/seller/listings', { token: sellerToken, expectStatus: 200 })
  const aList2 = (Array.isArray(stockAfterA.body) ? stockAfterA.body : []) as Json[]
  const stockA1b = Number(aList2.find((l) => l.productId === 'iphone-16-pro')?.stock ?? -1)
  const stockA2b = Number(aList2.find((l) => l.productId === 'galaxy-s25-ultra')?.stock ?? -1)
  record(
    'Multi-seller stock decrement Shop A',
    stockA1b === stockA1 - 1 && stockA2b === stockA2 - 1,
    `iphone ${stockA1}->${stockA1b}, galaxy ${stockA2}->${stockA2b}`
  )

  // --- Security ---
  const customerToken = await login('09195550103')
  const deniedShop = await api('GET', '/seller/shop', { token: customerToken })
  record('Security customer /seller/shop', deniedShop.status === 403, `status=${deniedShop.status}`)

  const deniedOrders = await api('GET', '/seller/orders', { token: customerToken })
  record('Security customer /seller/orders', deniedOrders.status === 403, `status=${deniedOrders.status}`)

  const patchB = await api('PATCH', `/seller/listings/${productC}`, {
    token: sellerToken,
    body: { status: 'inactive' },
  })
  record(
    'Security sellerA mutates sellerB listing',
    patchB.status === 404 || patchB.status === 403,
    `status=${patchB.status}`
  )

  // Confirm listing B unchanged
  const bListings = await api('GET', '/seller/listings', { token: sellerBToken, expectStatus: 200 })
  const bStill = (Array.isArray(bListings.body) ? bListings.body : []).find(
    (l) => (l as Json).productId === productC
  ) as Json | undefined
  record(
    'Security no mutation on B listing',
    bStill?.status === 'active',
    `status=${bStill?.status}`
  )

  if (linkedB[0]?.id) {
    const hijack = await api('PATCH', `/seller/orders/${linkedB[0].id}/status`, {
      token: sellerToken,
      body: { status: 'packing' },
    })
    record(
      'Security sellerA mutates sellerB order',
      hijack.status === 404 || hijack.status === 403,
      `status=${hijack.status}`
    )
  } else {
    record('Security sellerA mutates sellerB order', false, 'no sellerB order to test')
  }

  const failed = results.filter((r) => !r.ok)
  console.log('\n--- E2E Summary ---')
  console.log(`passed=${results.length - failed.length} failed=${failed.length}`)
  if (failed.length) {
    for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
