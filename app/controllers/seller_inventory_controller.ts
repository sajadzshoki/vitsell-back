import Product from '#models/product'
import SellerListing from '#models/seller_listing'
import StockMovement, { type StockMovementType } from '#models/stock_movement'
import {
  adjustInventoryValidator,
  inventoryQueryValidator,
} from '#validators/inventory'
import { querySellerInventory } from '#utils/seller_inventory_query'
import { resolveDefaultWarehouseId } from '#utils/seller_warehouses_query'
import { activeVariantStockTotal } from '#utils/product_variants'
import type { HttpContext } from '@adonisjs/core/http'

export default class SellerInventoryController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    if (qs.status === 'all' || qs.status === '') delete qs.status
    for (const key of ['warehouseId', 'category', 'brand', 'q'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    // FE uses warehouse= — map to warehouseId
    if (qs.warehouse && !qs.warehouseId) {
      qs.warehouseId = qs.warehouse
      delete qs.warehouse
    }
    if (qs.warehouseId === 'all') delete qs.warehouseId

    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await inventoryQueryValidator.validate(qs)
    return response.ok(await querySellerInventory(filters))
  }

  async adjust({ params, request, response }: HttpContext) {
    const listing = await SellerListing.query().where('product_id', params.productId).first()
    if (!listing) {
      return response.notFound({ errors: [{ field: 'productId', message: 'محصول یافت نشد' }] })
    }

    const payload = await request.validateUsing(adjustInventoryValidator)
    const before = Number(listing.stock) || 0
    const after = Math.max(0, Math.round(payload.stock))
    const delta = after - before
    const warehouseId =
      payload.warehouseId?.trim() || listing.warehouseId || (await resolveDefaultWarehouseId())

    listing.stock = after
    listing.warehouseId = warehouseId
    if (after <= 0) listing.status = 'out_of_stock'
    else if (listing.status === 'out_of_stock') listing.status = 'active'
    await listing.save()

    const product = await Product.find(listing.productId)
    if (product) {
      const variantStock = activeVariantStockTotal(product)
      product.inStock =
        listing.status !== 'out_of_stock' && Math.max(after, variantStock) > 0
      await product.save()
    }

    let type: StockMovementType = payload.type || 'adjust'
    if (!payload.type) {
      if (delta > 0) type = 'add'
      else if (delta < 0) type = 'remove'
      else type = 'adjust'
    }

    const movement = await StockMovement.create({
      id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      productId: listing.productId,
      productTitle: product?.title || listing.productId,
      variantId: payload.variantId ?? null,
      variantLabel: payload.variantLabel ?? null,
      warehouseId,
      type,
      quantity: delta,
      before,
      after,
      reason: (payload.reason ?? 'تنظیم موجودی').toString().trim() || 'تنظیم موجودی',
      actorName: (payload.actorName ?? 'مدیر').toString().trim() || 'مدیر',
    })

    return response.ok({
      listing: listing.toJSON(),
      product: product?.toCatalogJSON?.() ?? null,
      movement: movement.toAdminJSON(),
      row: {
        id: listing.productId,
        productId: listing.productId,
        productTitle: product?.title || listing.productId,
        sku: product?.sku || listing.productId,
        variantId: payload.variantId ?? null,
        variantLabel: payload.variantLabel ?? null,
        warehouseId,
        stock: after,
        reserved: Number(listing.reserved) || 0,
        available: Math.max(0, after - (Number(listing.reserved) || 0)),
        lowStockThreshold: Number(product?.lowStockThreshold) || 5,
        status:
          after <= 0
            ? 'out_of_stock'
            : after <= (Number(product?.lowStockThreshold) || 5)
              ? 'low_stock'
              : 'in_stock',
      },
    })
  }
}
