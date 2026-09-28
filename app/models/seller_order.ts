import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'
import Order from '#models/order'
import SellerOrderItemRow from '#models/seller_order_item_row'
import User from '#models/user'

export type SellerOrderItem = {
  productId: string
  qty: number
  price: number
  variantId?: string | null
  variantLabel?: string
}
export type SellerOrderAddress = {
  province: string
  city: string
  address: string
  postalCode: string
}

export type SellerOrderStatus =
  'new' | 'packing' | 'shipped' | 'delivered' | 'returned' | 'cancelled'

export const SELLER_ORDER_TRANSITIONS: Record<SellerOrderStatus, SellerOrderStatus[]> = {
  new: ['packing', 'cancelled'],
  packing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: [],
  returned: [],
  cancelled: [],
}

export default class SellerOrder extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_orders'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare shopId: number

  @column()
  declare buyerOrderId: string | null

  @column()
  declare stockReserved: boolean

  @column()
  declare date: string

  @column()
  declare dateKey: string

  @column()
  declare status: SellerOrderStatus

  @column()
  declare customerName: string

  @column()
  declare customerPhone: string

  @column()
  declare city: string

  @column({
    prepare: (value: SellerOrderAddress) => JSON.stringify(value),
    consume: (value: SellerOrderAddress | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare address: SellerOrderAddress

  @column({
    prepare: (value: SellerOrderItem[]) => JSON.stringify(value),
    consume: (value: SellerOrderItem[] | string) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare items: SellerOrderItem[]

  @column()
  declare total: number

  @column()
  declare shippingMethod: string

  @column()
  declare paymentMethod: string

  @column()
  declare note: string | null

  @column()
  declare trackingCode: string

  @column()
  declare carrier: string

  @column()
  declare estimatedDelivery: string

  @column({
    prepare: (value: unknown) => JSON.stringify(value ?? []),
    consume: (value: unknown) =>
      typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [],
  })
  declare timeline: Array<{
    id: string
    event: string
    at: string
    actor: string
    detail?: string
  }>

  @column({
    prepare: (value: unknown) => JSON.stringify(value ?? []),
    consume: (value: unknown) =>
      typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [],
  })
  declare internalNotes: Array<{
    id: string
    text: string
    author: string
    createdAt: string
  }>

  @column({
    prepare: (value: unknown) => JSON.stringify(value ?? []),
    consume: (value: unknown) =>
      typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [],
  })
  declare refunds: Array<{
    id: string
    amount: number
    reason: string
    status: string
    transactionId: string
    createdAt: string
    actorName: string
  }>

  @column()
  declare refundedAmount: number

  @column()
  declare courierId: number | null

  @column()
  declare deliveryCode: string

  @column()
  declare deliveryAttemptCount: number

  @column.dateTime()
  declare deliveryAttemptResetAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShop, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof SellerShop>

  @belongsTo(() => Order, { foreignKey: 'buyerOrderId' })
  declare buyerOrder: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'courierId' })
  declare courier: BelongsTo<typeof User>

  @hasMany(() => SellerOrderItemRow, { foreignKey: 'sellerOrderId' })
  declare itemRows: HasMany<typeof SellerOrderItemRow>

  toJSON() {
    return {
      id: this.id,
      buyerOrderId: this.buyerOrderId,
      date: this.date,
      dateKey: this.dateKey,
      status: this.status,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      city: this.city,
      address: this.address,
      items: this.items,
      total: Number(this.total),
      shippingMethod: this.shippingMethod,
      paymentMethod: this.paymentMethod,
      ...(this.note ? { note: this.note } : {}),
      trackingCode: this.trackingCode ?? '',
      carrier: this.carrier ?? '',
      estimatedDelivery: this.estimatedDelivery ?? '',
      timeline: Array.isArray(this.timeline) ? this.timeline : [],
      internalNotes: Array.isArray(this.internalNotes) ? this.internalNotes : [],
      refunds: Array.isArray(this.refunds) ? this.refunds : [],
      refundedAmount: Number(this.refundedAmount) || 0,
      courierId: this.courierId ?? null,
      courierName: courierDisplayName(this),
    }
  }
}

function courierDisplayName(order: SellerOrder) {
  const courier = order.$preloaded.courier as User | undefined
  if (!courier) return null
  const name = [courier.profile?.firstName, courier.profile?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
  return name || courier.phone
}
