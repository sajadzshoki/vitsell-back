import Address from '#models/address'
import CartItem from '#models/cart_item'
import DiscountCode from '#models/discount_code'
import Notification from '#models/notification'
import Order from '#models/order'
import OrderItemRow from '#models/order_item_row'
import Product from '#models/product'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerOrderItemRow from '#models/seller_order_item_row'
import User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'

const FREE_SHIPPING_THRESHOLD = 500_000

export type PlaceCheckoutInput = {
  addressId: string
  shippingMethod: 'express' | 'post' | 'pickup'
  paymentMethod: 'online' | 'cod' | 'installment'
  discountCode?: string
}

export class CheckoutError extends Error {
  constructor(
    public status: number,
    public field: string,
    message: string
  ) {
    super(message)
  }
}

function shippingPrice(method: 'express' | 'post' | 'pickup', subtotal: number) {
  if (method === 'pickup' || subtotal <= 0) return 0
  const free = subtotal >= FREE_SHIPPING_THRESHOLD
  if (method === 'express') return free ? 45_000 : 55_000
  return free ? 0 : 40_000
}

function shippingLabel(method: string) {
  if (method === 'express') return 'پیک اکسپرس'
  if (method === 'post') return 'پست پیشتاز'
  return 'دریافت حضوری'
}

function paymentLabel(method: string) {
  if (method === 'online') return 'پرداخت آنلاین'
  if (method === 'cod') return 'پرداخت در محل'
  return 'پرداخت اقساطی'
}

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function dateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

type CartLine = {
  productId: string
  qty: number
  product: Product
  listing: SellerListing
}

export default class CheckoutService {
  async place(user: User, input: PlaceCheckoutInput) {
    const address = await Address.query()
      .where('user_id', user.id)
      .where('id', input.addressId)
      .first()
    if (!address) {
      throw new CheckoutError(422, 'addressId', 'آدرس معتبر نیست')
    }

    const cartItems = await CartItem.query().where('user_id', user.id).preload('product')
    if (!cartItems.length) {
      throw new CheckoutError(422, 'cart', 'سبد خرید خالی است')
    }

    const productIds = cartItems.map((i) => i.productId)
    const listings = await SellerListing.query()
      .whereIn('product_id', productIds)
      .where('status', 'active')

    const listingByProduct = new Map(listings.map((l) => [l.productId, l]))

    const lines: CartLine[] = []
    for (const item of cartItems) {
      if (!item.product) {
        throw new CheckoutError(422, 'cart', 'محصول سبد نامعتبر است')
      }
      const listing = listingByProduct.get(item.productId)
      if (!listing) {
        throw new CheckoutError(
          422,
          'cart',
          `محصول «${item.product.title}» فروشنده فعال ندارد`
        )
      }
      if (listing.stock < item.qty) {
        throw new CheckoutError(
          409,
          'stock',
          `موجودی «${item.product.title}» کافی نیست`
        )
      }
      lines.push({
        productId: item.productId,
        qty: item.qty,
        product: item.product,
        listing,
      })
    }

    const subtotal = lines.reduce((sum, i) => sum + Number(i.product.price) * i.qty, 0)

    let discountAmount = 0
    let discountCode: string | null = null
    if (input.discountCode) {
      const code = input.discountCode.trim().toUpperCase()
      const row = await DiscountCode.find(code)
      if (!row || !row.active) {
        throw new CheckoutError(422, 'discountCode', 'کد تخفیف نامعتبر است')
      }
      discountAmount = Math.floor(subtotal * row.percent)
      discountCode = code
    }

    const shipCost = shippingPrice(input.shippingMethod, subtotal)
    const total = Math.max(0, subtotal - discountAmount + shipCost)
    const orderId = `BZ-${Math.floor(100000 + Math.random() * 900000)}`
    const isOnline = input.paymentMethod === 'online'
    const shipLabel = shippingLabel(input.shippingMethod)
    const payLabel = paymentLabel(input.paymentMethod)
    const date = jalaliishDate()
    const addrJson = address.toJSON()

    const orderItemsJson = lines.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      price: Number(i.product.price),
    }))

    const order = await db.transaction(async (trx) => {
      await this.reserveStock(trx, lines)

      const created = await Order.create(
        {
          id: orderId,
          userId: user.id,
          date,
          status: isOnline ? 'pending_payment' : 'processing',
          items: orderItemsJson,
          total,
          shippingMethod: shipLabel,
          paymentMethod: payLabel,
          address: addrJson,
          discountCode,
          discountAmount,
          shippingCost: shipCost,
        },
        { client: trx }
      )

      for (const line of lines) {
        await OrderItemRow.create(
          {
            orderId: created.id,
            productId: line.productId,
            qty: line.qty,
            unitPrice: Number(line.product.price),
          },
          { client: trx }
        )
        line.product.useTransaction(trx)
        line.product.soldCount += line.qty
        await line.product.save()
      }

      const byShop = new Map<number, CartLine[]>()
      for (const line of lines) {
        const list = byShop.get(line.listing.shopId) ?? []
        list.push(line)
        byShop.set(line.listing.shopId, list)
      }

      let sellerIdx = 0
      for (const [shopId, shopLines] of byShop) {
        sellerIdx += 1
        const sellerItems = shopLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          price: Number(l.product.price),
        }))
        const sellerTotal = sellerItems.reduce((s, i) => s + i.price * i.qty, 0)
        const sellerOrderId = `${orderId}-S${sellerIdx}`

        const sellerOrder = await SellerOrder.create(
          {
            id: sellerOrderId,
            shopId,
            buyerOrderId: created.id,
            stockReserved: true,
            date,
            dateKey: dateKey(),
            status: isOnline ? 'new' : 'new',
            customerName: addrJson.fullName,
            customerPhone: addrJson.phone,
            city: addrJson.city,
            address: {
              province: addrJson.province,
              city: addrJson.city,
              address: addrJson.address,
              postalCode: addrJson.postalCode,
            },
            items: sellerItems,
            total: sellerTotal,
            shippingMethod: shipLabel,
            paymentMethod: payLabel,
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
      }

      if (!isOnline) {
        await CartItem.query({ client: trx }).where('user_id', user.id).delete()
        await Notification.create(
          {
            id: `n${Date.now()}`,
            userId: user.id,
            title: 'سفارش شما ثبت شد',
            description: `سفارش ${orderId} با موفقیت ثبت شد.`,
            time: 'همین الان',
            icon: 'i-tabler-package',
            read: false,
            to: `/order/${orderId}`,
          },
          { client: trx }
        )
      }

      return created
    })

    return { order, total, isOnline }
  }

  private async reserveStock(trx: TransactionClientContract, lines: CartLine[]) {
    const listingIds = [...new Set(lines.map((l) => l.listing.id))]
    const locked = await SellerListing.query({ client: trx })
      .whereIn('id', listingIds)
      .forUpdate()

    const lockedMap = new Map(locked.map((l) => [l.id, l]))

    for (const line of lines) {
      const listing = lockedMap.get(line.listing.id)
      if (!listing || listing.status !== 'active') {
        throw new CheckoutError(409, 'stock', `محصول ${line.productId} در دسترس نیست`)
      }
      if (listing.stock < line.qty) {
        throw new CheckoutError(409, 'stock', `موجودی «${line.product.title}» کافی نیست`)
      }
      listing.stock -= line.qty
      listing.sold += line.qty
      if (listing.stock <= 0) {
        listing.stock = 0
        listing.status = 'out_of_stock'
      }
      await listing.useTransaction(trx).save()
    }
  }

  async restoreStockForOrder(orderId: string, trx?: TransactionClientContract) {
    const q = SellerOrder.query()
    if (trx) q.useTransaction(trx)
    const sellerOrders = await q.where('buyer_order_id', orderId).where('stock_reserved', true)

    for (const so of sellerOrders) {
      for (const item of so.items) {
        const listingQ = SellerListing.query().where('shop_id', so.shopId).where('product_id', item.productId)
        if (trx) listingQ.useTransaction(trx)
        const listing = await listingQ.forUpdate().first()
        if (!listing) continue
        listing.stock += item.qty
        listing.sold = Math.max(0, listing.sold - item.qty)
        if (listing.status === 'out_of_stock' && listing.stock > 0) {
          listing.status = 'active'
        }
        await listing.save()

        const productQ = Product.query().where('id', item.productId)
        if (trx) productQ.useTransaction(trx)
        const product = await productQ.first()
        if (product) {
          product.soldCount = Math.max(0, product.soldCount - item.qty)
          await product.save()
        }
      }
      so.stockReserved = false
      if (trx) so.useTransaction(trx)
      await so.save()
    }
  }
}
