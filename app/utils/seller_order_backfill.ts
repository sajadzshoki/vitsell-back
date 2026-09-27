import Order from '#models/order'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import type { SellerOrderStatus } from '#models/seller_order'
import SellerOrderItemRow from '#models/seller_order_item_row'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

function dateKeyFromOrder(order: Order) {
  const d = order.createdAt?.toJSDate?.() ?? new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function sellerStatusFromBuyer(status: Order['status']): SellerOrderStatus {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'delivered') return 'delivered'
  if (status === 'shipping') return 'shipped'
  return 'new'
}

async function resolveSiteShop() {
  let siteShop = await SellerShop.query().where('slug', 'vitsell').first()
  if (!siteShop) {
    siteShop = await SellerShop.query().orderBy('id', 'asc').first()
  }
  if (!siteShop) {
    const admin = await User.query().where('role', 'admin').first()
    siteShop = await SellerShop.create({
      userId: admin?.id ?? 1,
      name: 'ویتسل',
      slug: 'vitsell',
      phone: '',
      email: '',
      city: 'تهران',
      about: '',
      rating: 0,
      reviewCount: 0,
      joinDate: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date()),
    })
  }
  return siteShop
}

/**
 * Creates SellerOrder rows for buyer Orders that never got them
 * (legacy CheckoutController.place path before marketplace wiring).
 * Idempotent — cheap no-op when no orphans exist.
 */
export async function backfillOrphanSellerOrders() {
  const orphanIds = await db
    .from('orders')
    .leftJoin('seller_orders', 'seller_orders.buyer_order_id', 'orders.id')
    .whereNull('seller_orders.id')
    .orderBy('orders.created_at', 'desc')
    .limit(50)
    .select('orders.id')

  const ids = orphanIds.map((r: { id: string }) => r.id).filter(Boolean)
  if (!ids.length) return 0

  const orphans = await Order.query().whereIn('id', ids)
  if (!orphans.length) return 0

  const siteShop = await resolveSiteShop()
  let created = 0

  for (const order of orphans) {
    const items = Array.isArray(order.items) ? order.items : []
    if (!items.length) continue

    const productIds = items.map((i) => i.productId)
    const listings = await SellerListing.query()
      .whereIn('product_id', productIds)
      .where('status', 'active')
    const listingByProduct = new Map(listings.map((l) => [l.productId, l]))

    const byShop = new Map<number, typeof items>()
    for (const item of items) {
      const shopId = listingByProduct.get(item.productId)?.shopId ?? siteShop.id
      const list = byShop.get(shopId) ?? []
      list.push(item)
      byShop.set(shopId, list)
    }

    const addr = order.address || ({} as Order['address'])

    await db.transaction(async (trx) => {
      const already = await SellerOrder.query({ client: trx })
        .where('buyer_order_id', order.id)
        .first()
      if (already) return

      let idx = 0
      for (const [shopId, shopItems] of byShop) {
        idx += 1
        const sellerItems = shopItems.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          price: Number(i.price),
          variantId: i.variantId ?? null,
          variantLabel: i.variantLabel,
        }))
        const total = sellerItems.reduce((s, i) => s + i.price * i.qty, 0)
        const sellerOrder = await SellerOrder.create(
          {
            id: `${order.id}-S${idx}`,
            shopId,
            buyerOrderId: order.id,
            stockReserved: false,
            date: order.date,
            dateKey: dateKeyFromOrder(order),
            status: sellerStatusFromBuyer(order.status),
            customerName: addr.fullName || '—',
            customerPhone: addr.phone || '—',
            city: addr.city || '—',
            address: {
              province: addr.province || '',
              city: addr.city || '',
              address: addr.address || '',
              postalCode: addr.postalCode || '',
            },
            items: sellerItems,
            total,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            note: null,
          },
          { client: trx }
        )

        for (const item of sellerItems) {
          await SellerOrderItemRow.create(
            {
              sellerOrderId: sellerOrder.id,
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.price,
            },
            { client: trx }
          )
        }
        created += 1
      }
    })
  }

  return created
}
