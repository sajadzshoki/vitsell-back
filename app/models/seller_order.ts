import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SellerShop from '#models/seller_shop'

export type SellerOrderItem = { productId: string; qty: number; price: number }
export type SellerOrderAddress = {
  province: string
  city: string
  address: string
  postalCode: string
}

export default class SellerOrder extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'seller_orders'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare shopId: number

  @column()
  declare date: string

  @column()
  declare dateKey: string

  @column()
  declare status: 'new' | 'packing' | 'shipped' | 'delivered' | 'returned' | 'cancelled'

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

  toJSON() {
    return {
      id: this.id,
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
