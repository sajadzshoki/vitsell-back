import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Payment from '#models/payment'
import OrderItemRow from '#models/order_item_row'
import SellerOrder from '#models/seller_order'

export type OrderItem = {
  productId: string
  qty: number
  price: number
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

export type OrderStatus =
  | 'delivered'
  | 'shipping'
  | 'processing'
  | 'cancelled'
  | 'pending_payment'

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

  @column()
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

  @column()
  declare discountAmount: number

  @column()
  declare shippingCost: number

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

  toShopOrderJSON() {
    const status =
      this.status === 'pending_payment' ? ('processing' as const) : this.status
    return {
      id: this.id,
      date: this.date,
      status,
      items: this.items,
      total: Number(this.total),
      shippingMethod: this.shippingMethod,
      paymentMethod: this.paymentMethod,
      address: this.address,
    }
  }
}
