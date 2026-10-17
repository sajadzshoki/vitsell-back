import Address from '#models/address'
import CartItem from '#models/cart_item'
import Notification from '#models/notification'
import Order from '#models/order'
import OrderItemRow from '#models/order_item_row'
import Product from '#models/product'
import SellerListing from '#models/seller_listing'
import SellerOrder from '#models/seller_order'
import SellerOrderItemRow from '#models/seller_order_item_row'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import { DiscountResolveError, resolveDiscountAmount } from '#utils/discount_codes'
import { generateDeliveryCode } from '#utils/delivery_code'
import { notifyOrderPlaced } from '#utils/order_sms'
import { loadPlatformSettings } from '#utils/platform_settings'
import {
  resolveCheckoutShippingMethod,
  shippingCostForMethod,
  shippingMethodLabel,
} from '#utils/checkout_shipping'
import {
  cartAllProductsFastDelivery,
  confirmSlotReservation,
  holdSlotReservation,
  releaseSlotReservation,
  resolveMethodPrice,
  validateSlotSelection,
} from '#utils/shipping_slots'
import SellerShippingMethod from '#models/seller_shipping_method'
import { moneyAmount } from '#utils/money'
import { DateTime } from 'luxon'
import {
  activeVariantStockTotal,
  applyVariantStockDelta,
  findProductVariant,
  productVariantLabel,
  productVariantPrice,
  productVariants,
} from '#utils/product_variants'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'

const FALLBACK_FREE_SHIPPING_THRESHOLD = 500_000

export type PlaceCheckoutInput = {
  addressId: string
  shippingMethod: string
  paymentMethod: 'online' | 'cod' | 'installment'
  discountCode?: string
  shippingSlotDate?: string
  shippingSlotStart?: string
  shippingSlotEnd?: string
  shippingIsExpress?: boolean
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
      joinDate: jalaliishDate(),
    })
  }
  return siteShop
}

type CartLine = {
  productId: string
  qty: number
  product: Product
  listing: SellerListing | null
  shopId: number
  variantId: string | null
  variantLabel: string
  unitPrice: number
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
    const platform = await loadPlatformSettings()
    const siteShop = await resolveSiteShop()

    const lines: CartLine[] = []
    for (const item of cartItems) {
      if (!item.product) {
        throw new CheckoutError(422, 'cart', 'محصول سبد نامعتبر است')
      }

      if (item.product.published === false) {
        throw new CheckoutError(409, 'cart', `محصول «${item.product.title}» غیرفعال است`)
      }

      const variant = findProductVariant(item.product, item.variantId)
      const hasVariants = productVariants(item.product).length > 0
      if (hasVariants && !variant) {
        throw new CheckoutError(409, 'cart', `واریانت «${item.product.title}» معتبر نیست`)
      }
      if (variant && (variant.status !== 'active' || Number(variant.stock) < item.qty)) {
        throw new CheckoutError(409, 'stock', `موجودی «${item.product.title}» کافی نیست`)
      }

      const listing = listingByProduct.get(item.productId) ?? null
      if (!listing) {
        throw new CheckoutError(409, 'cart', `محصول «${item.product.title}» در دسترس نیست`)
      }
      // Variant stock is authoritative when variants exist; listing stock for simple products.
      if (
        !hasVariants
        && listing.stock < item.qty
        && platform.outOfStockBehavior !== 'allow_backorder'
      ) {
        throw new CheckoutError(409, 'stock', `موجودی «${item.product.title}» کافی نیست`)
      }

      lines.push({
        productId: item.productId,
        qty: item.qty,
        product: item.product,
        listing,
        shopId: listing?.shopId ?? siteShop.id,
        variantId: item.variantId,
        variantLabel: productVariantLabel(variant),
        unitPrice: productVariantPrice(item.product, variant),
      })
    }

    const subtotal = lines.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)

    if (platform.minOrderAmount > 0 && subtotal < platform.minOrderAmount) {
      throw new CheckoutError(
        422,
        'minOrder',
        `حداقل مبلغ سفارش ${platform.minOrderAmount.toLocaleString('fa-IR')} ${platform.currencyLabel} است`
      )
    }

    let discountAmount = 0
    let discountCode: string | null = null
    if (input.discountCode) {
      try {
        const resolved = await resolveDiscountAmount({
          code: input.discountCode,
          subtotal,
          userId: user.id,
        })
        discountAmount = resolved.amount
        discountCode = resolved.code
      } catch (err) {
        if (err instanceof DiscountResolveError) {
          throw new CheckoutError(422, err.field, err.message)
        }
        throw err
      }
    }

    const shipMethod = await resolveCheckoutShippingMethod(input.shippingMethod)
    if (!shipMethod) {
      throw new CheckoutError(422, 'shippingMethod', 'روش ارسال معتبر نیست')
    }

    const addrJson = address.toJSON()
    const methodModel =
      shipMethod instanceof SellerShippingMethod
        ? shipMethod
        : await SellerShippingMethod.find(shipMethod.id)

    let resolvedBasePrice = moneyAmount(shipMethod.baseCost)
    if (methodModel) {
      const priced = await resolveMethodPrice(methodModel, addrJson.province, addrJson.city)
      if (!priced.ok) {
        throw new CheckoutError(422, 'shippingMethod', priced.reason)
      }
      resolvedBasePrice = priced.price
    }

    const allFast = await cartAllProductsFastDelivery(productIds)
    const wantsExpress = Boolean(input.shippingIsExpress)
    const slotsEnabled = Boolean(
      methodModel?.slotsEnabled ?? (shipMethod as { slotsEnabled?: boolean }).slotsEnabled
    )

    let slotPrice = resolvedBasePrice
    let slotDate: string | null = null
    let slotStart: string | null = null
    let slotEnd: string | null = null
    let isExpress = false

    if (slotsEnabled && methodModel) {
      if (!input.shippingSlotDate || !input.shippingSlotStart || !input.shippingSlotEnd) {
        throw new CheckoutError(422, 'shippingSlot', 'انتخاب روز و بازه زمانی ارسال الزامی است')
      }
      const validated = await validateSlotSelection({
        method: methodModel,
        date: input.shippingSlotDate,
        startTime: input.shippingSlotStart,
        endTime: input.shippingSlotEnd,
        isExpress: wantsExpress,
        basePrice: resolvedBasePrice,
        cartAllFastDelivery: allFast,
      })
      if (!validated.ok) {
        throw new CheckoutError(422, 'shippingSlot', validated.reason)
      }
      slotPrice = validated.price
      slotDate = input.shippingSlotDate
      slotStart = validated.slot.startTime || input.shippingSlotStart
      slotEnd = validated.slot.endTime || input.shippingSlotEnd
      isExpress = wantsExpress && allFast
    } else if (wantsExpress) {
      throw new CheckoutError(422, 'shippingIsExpress', 'ارسال سریع برای این روش فعال نیست')
    }

    const freeThreshold =
      platform.freeShippingThreshold > 0
        ? platform.freeShippingThreshold
        : FALLBACK_FREE_SHIPPING_THRESHOLD
    const shipCost = shippingCostForMethod(shipMethod, subtotal, freeThreshold, slotPrice)
    const total = Math.max(0, subtotal - discountAmount + shipCost)
    const orderId = `BZ-${Math.floor(100000 + Math.random() * 900000)}`
    const isOnline = input.paymentMethod === 'online'
    const shipLabel = shippingMethodLabel(shipMethod)
    const payLabel = paymentLabel(input.paymentMethod)
    const date = jalaliishDate()

    const orderItemsJson = lines.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      price: i.unitPrice,
      variantId: i.variantId,
      variantLabel: i.variantLabel,
    }))

    const order = await db.transaction(async (trx) => {
      const reservable = lines.filter((l) => l.listing)
      if (reservable.length) {
        await this.reserveStock(trx, reservable, platform.outOfStockBehavior === 'allow_backorder')
      }

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
          shippingMethodId: shipMethod.id,
          shippingSlotDate: slotDate ? DateTime.fromISO(slotDate) : null,
          shippingSlotStart: slotStart,
          shippingSlotEnd: slotEnd,
          shippingIsExpress: isExpress,
        },
        { client: trx }
      )

      if (slotsEnabled && slotDate && slotStart && slotEnd) {
        await holdSlotReservation({
          methodId: shipMethod.id,
          orderId,
          date: slotDate,
          startTime: slotStart,
          endTime: slotEnd,
          isExpress,
          status: isOnline ? 'held' : 'confirmed',
          trx,
        })
      }

      for (const line of lines) {
        await OrderItemRow.create(
          {
            orderId: created.id,
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
          },
          { client: trx }
        )
        line.product.useTransaction(trx)
        line.product.soldCount += line.qty
        await line.product.save()
      }

      const byShop = new Map<number, CartLine[]>()
      for (const line of lines) {
        const list = byShop.get(line.shopId) ?? []
        list.push(line)
        byShop.set(line.shopId, list)
      }

      let sellerIdx = 0
      for (const [shopId, shopLines] of byShop) {
        sellerIdx += 1
        const sellerItems = shopLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          price: l.unitPrice,
          variantId: l.variantId,
          variantLabel: l.variantLabel,
        }))
        const sellerTotal = sellerItems.reduce((s, i) => s + i.price * i.qty, 0)
        const sellerOrderId = `${orderId}-S${sellerIdx}`
        const stockReserved = shopLines.some((l) => l.listing)

        const sellerOrder = await SellerOrder.create(
          {
            id: sellerOrderId,
            shopId,
            buyerOrderId: created.id,
            stockReserved,
            date,
            dateKey: dateKey(),
            status: 'new',
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
            deliveryCode: generateDeliveryCode(),
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

    if (!isOnline) {
      await notifyOrderPlaced(order.id)
    }

    return { order, total, isOnline }
  }

  /**
   * Cancel seller-side rows and release reserved listing stock when online payment fails.
   */
  async cancelAfterFailedPayment(orderId: string) {
    await db.transaction(async (trx) => {
      await this.restoreStockForOrder(orderId, trx)
      const sellerOrders = await SellerOrder.query({ client: trx }).where('buyer_order_id', orderId)
      for (const so of sellerOrders) {
        if (so.status !== 'cancelled') {
          so.status = 'cancelled'
          await so.useTransaction(trx).save()
        }
      }
    })
    await releaseSlotReservation(orderId)
  }

  async confirmShippingSlot(orderId: string) {
    await confirmSlotReservation(orderId)
  }

  private async reserveStock(
    trx: TransactionClientContract,
    lines: CartLine[],
    allowBackorder = false
  ) {
    const listingIds = [...new Set(lines.map((l) => l.listing!.id))]
    const locked = await SellerListing.query({ client: trx }).whereIn('id', listingIds).forUpdate()

    const lockedMap = new Map(locked.map((l) => [l.id, l]))

    for (const line of lines) {
      const listing = lockedMap.get(line.listing!.id)
      if (!listing || listing.status !== 'active') {
        throw new CheckoutError(409, 'stock', `محصول ${line.productId} در دسترس نیست`)
      }

      const product = await Product.query({ client: trx }).where('id', line.productId).forUpdate().first()
      if (!product || product.published === false) {
        throw new CheckoutError(409, 'stock', `محصول ${line.productId} در دسترس نیست`)
      }

      const hasVariants = productVariants(product).length > 0
      if (hasVariants) {
        const variant = findProductVariant(product, line.variantId)
        if (!variant || variant.status !== 'active') {
          throw new CheckoutError(409, 'stock', `موجودی «${line.product.title}» کافی نیست`)
        }
        if (Number(variant.stock) < line.qty && !allowBackorder) {
          throw new CheckoutError(409, 'stock', `موجودی «${line.product.title}» کافی نیست`)
        }
        applyVariantStockDelta(product, line.variantId, -line.qty)
        const variantStock = activeVariantStockTotal(product)
        listing.stock = variantStock
        listing.sold += line.qty
        if (variantStock <= 0) {
          listing.stock = 0
          listing.status = 'out_of_stock'
        }
        product.inStock = variantStock > 0
        await product.useTransaction(trx).save()
        await listing.useTransaction(trx).save()
        line.product = product
        continue
      }

      if (listing.stock < line.qty && !allowBackorder) {
        throw new CheckoutError(409, 'stock', `موجودی «${line.product.title}» کافی نیست`)
      }
      listing.stock = Math.max(0, listing.stock - line.qty)
      listing.sold += line.qty
      if (listing.stock <= 0) {
        listing.stock = 0
        listing.status = 'out_of_stock'
      }
      product.inStock = listing.stock > 0
      await product.useTransaction(trx).save()
      await listing.useTransaction(trx).save()
      line.product = product
    }
  }

  async restoreStockForOrder(orderId: string, trx?: TransactionClientContract) {
    const q = SellerOrder.query()
    if (trx) q.useTransaction(trx)
    const sellerOrders = await q.where('buyer_order_id', orderId).where('stock_reserved', true)

    for (const so of sellerOrders) {
      for (const item of so.items) {
        const listingQ = SellerListing.query()
          .where('shop_id', so.shopId)
          .where('product_id', item.productId)
        if (trx) listingQ.useTransaction(trx)
        const listing = await listingQ.forUpdate().first()
        if (!listing) continue

        const productQ = Product.query().where('id', item.productId)
        if (trx) productQ.useTransaction(trx)
        const product = await productQ.forUpdate().first()
        if (product) {
          if (item.variantId && productVariants(product).length) {
            applyVariantStockDelta(product, item.variantId, item.qty)
            listing.stock = activeVariantStockTotal(product)
          } else {
            listing.stock += item.qty
          }
          product.soldCount = Math.max(0, product.soldCount - item.qty)
          product.inStock = Math.max(Number(listing.stock) || 0, activeVariantStockTotal(product)) > 0
          await product.save()
        } else {
          listing.stock += item.qty
        }

        listing.sold = Math.max(0, listing.sold - item.qty)
        if (listing.status === 'out_of_stock' && listing.stock > 0) {
          listing.status = 'active'
        }
        await listing.save()
      }
      so.stockReserved = false
      if (trx) so.useTransaction(trx)
      await so.save()
    }
  }
}
