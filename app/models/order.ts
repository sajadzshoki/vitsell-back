import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Payment from '#models/payment'
import OrderItemRow from '#models/order_item_row'
import SellerOrder, { type SellerOrderStatus } from '#models/seller_order'

export type OrderItem = {
  productId: string
  qty: number
  price: number
  variantId?: string | null
  variantLabel?: string
}

export type OrderAddress = {
  id: string
  title: string
  fullName: string
  phone: string
  province: string
  city: string
  address: string
  postalCode: string
  isDefault?: boolean
}

export type OrderStatus = 'delivered' | 'shipping' | 'processing' | 'cancelled' | 'pending_payment'

/** Coarse buyer-row status kept in sync when the seller changes fulfillment. */
export function buyerStatusFromSeller(status: SellerOrderStatus): OrderStatus {
  if (status === 'shipped') return 'shipping'
  if (status === 'delivered') return 'delivered'
  if (status === 'cancelled' || status === 'returned') return 'cancelled'
  return 'processing'
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export default class Order extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @column()
  declare date: string

  @column()
  declare status: OrderStatus

  @column({
    prepare: (value: OrderItem[]) => JSON.stringify(value),
    consume: (value: OrderItem[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare items: OrderItem[]

  @column({
    consume: (value: unknown) => Number(value) || 0,
  })
  declare total: number

  @column()
  declare shippingMethod: string

  @column()
  declare paymentMethod: string

  @column({
    prepare: (value: OrderAddress) => JSON.stringify(value),
    consume: (value: OrderAddress | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare address: OrderAddress

  @column()
  declare discountCode: string | null

  @column({
    consume: (value: unknown) => Number(value) || 0,
  })
  declare discountAmount: number

  @column({
    consume: (value: unknown) => Number(value) || 0,
  })
  declare shippingCost: number

  @column()
  declare shippingMethodId: string | null

  @column.date()
  declare shippingSlotDate: DateTime | null

  @column()
  declare shippingSlotStart: string | null

  @column()
  declare shippingSlotEnd: string | null

  @column()
  declare shippingIsExpress: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasOne(() => Payment)
  declare payment: HasOne<typeof Payment>

  @hasMany(() => OrderItemRow)
  declare itemRows: HasMany<typeof OrderItemRow>

  @hasMany(() => SellerOrder, { foreignKey: 'buyerOrderId' })
  declare sellerOrders: HasMany<typeof SellerOrder>

  toShopOrderJSON(extras?: {
    trackingCode?: string | null
    carrier?: string | null
    /** Seller fulfillment status — this is what the storefront shows. */
    sellerStatus?: string | null
    /** Detail-only. Never attach this on list endpoints. */
    deliveryCodes?: { id: string, code: string }[]
  }) {
    const sellerStatus = extras?.sellerStatus?.trim()
    const status = sellerStatus || (this.status === 'pending_payment' ? 'processing' : this.status)
    const trackingCode = extras?.trackingCode?.trim() || undefined
    const carrier = extras?.carrier?.trim() || undefined
    return {
      id: this.id,
      date: this.date,
      status,
      items: this.items,
      total: Number(this.total),
      shippingMethod: this.shippingMethod,
      shippingMethodId: this.shippingMethodId,
      shippingSlotDate: this.shippingSlotDate?.toISODate?.() ?? this.shippingSlotDate ?? null,
      shippingSlotStart: this.shippingSlotStart,
      shippingSlotEnd: this.shippingSlotEnd,
      shippingIsExpress: Boolean(this.shippingIsExpress),
      paymentMethod: this.paymentMethod,
      shippingCost: Number(this.shippingCost) || 0,
      discountAmount: Number(this.discountAmount) || 0,
      discountCode: this.discountCode,
      address: this.address,
      ...(trackingCode ? { trackingCode } : {}),
      ...(carrier ? { carrier } : {}),
      ...(extras?.deliveryCodes?.length ? { deliveryCodes: extras.deliveryCodes } : {}),
    }
  }
}
