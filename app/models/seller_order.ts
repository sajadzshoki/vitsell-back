import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'
import Order from '#models/order'
import SellerOrderItemRow from '#models/seller_order_item_row'

export type SellerOrderItem = { productId: string; qty: number; price: number }
export type SellerOrderAddress = {
  province: string
  city: string
  address: string
  postalCode: string
}

export type SellerOrderStatus =
  | 'new'
  | 'packing'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SellerShop, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof SellerShop>

  @belongsTo(() => Order, { foreignKey: 'buyerOrderId' })
  declare buyerOrder: BelongsTo<typeof Order>

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
    }
  }
}
