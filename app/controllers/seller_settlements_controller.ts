import type { HttpContext } from '@adonisjs/core/http'
import SellerPayout from '#models/seller_payout'
import SellerShop from '#models/seller_shop'
import User from '#models/user'
import { defaultSiteSettings } from '#utils/site_settings'
import {
  findSellerSettlement,
  querySellerSettlements,
  syncPayoutStatusFromSettlement,
} from '#utils/seller_settlements_query'
import {
  settlementsQueryValidator,
  storeSettlementValidator,
  updateSettlementStatusValidator,
} from '#validators/settlements'

function jalaliishDate() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
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
      name: defaultSiteSettings.name,
      slug: defaultSiteSettings.slug,
      phone: defaultSiteSettings.phone,
      email: defaultSiteSettings.email,
      city: defaultSiteSettings.city,
      about: defaultSiteSettings.about,
      rating: 0,
      reviewCount: 0,
      joinDate: jalaliishDate(),
    })
  }
  return siteShop
}

function nextSettlementId() {
  return `PO-${Math.floor(1000 + Math.random() * 9000)}`
}

export default class SellerSettlementsController {
  async index({ request, response }: HttpContext) {
    const qs = { ...request.qs() }
    for (const key of ['status', 'source', 'gateway', 'q'] as const) {
      if (qs[key] === 'all' || qs[key] === '') delete qs[key]
    }
    for (const key of ['page', 'pageSize'] as const) {
      if (qs[key] === '' || qs[key] == null) delete qs[key]
      else if (qs[key] != null) qs[key] = Number(qs[key])
    }
    if (qs.all === '1' || qs.all === 'true') qs.all = true
    else if (qs.all === '0' || qs.all === 'false' || qs.all === '') delete qs.all

    const filters = await settlementsQueryValidator.validate(qs)
    return response.ok(await querySellerSettlements(filters))
  }

  async show({ params, response }: HttpContext) {
    const row = await findSellerSettlement(String(params.id || ''))
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تسویه یافت نشد' }] })
    }
    return response.ok(row.toSettlementJSON())
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(storeSettlementValidator)
    const amount = Math.round(payload.amount)
    if (amount <= 0) {
      return response.unprocessableEntity({
        errors: [{ field: 'amount', message: 'مبلغ تسویه نامعتبر است' }],
      })
    }
    const fees =
      payload.fees != null
        ? Math.max(0, Math.round(payload.fees))
        : Math.round(amount * 0.01)

    const siteShop = await resolveSiteShop()
    const payout = await SellerPayout.create({
      id: nextSettlementId(),
      shopId: siteShop.id,
      date: jalaliishDate(),
      amount,
      status: 'pending',
      fees,
      gateway: (payload.gateway || 'زرین‌پال').trim() || 'زرین‌پال',
      source: payload.source || 'gateway',
      reference: (payload.reference || '').trim(),
      note: (payload.note || '').trim() || null,
      settlementStatus: 'pending',
    })
    return response.created(payout.toSettlementJSON())
  }

  async setStatus({ params, request, response }: HttpContext) {
    const row = await findSellerSettlement(String(params.id || ''))
    if (!row) {
      return response.notFound({ errors: [{ field: 'id', message: 'تسویه یافت نشد' }] })
    }
    const payload = await request.validateUsing(updateSettlementStatusValidator)
    row.settlementStatus = payload.status
    row.status = syncPayoutStatusFromSettlement(payload.status)
    if (payload.reference != null) {
      row.reference = payload.reference.trim()
    }
    await row.save()
    return response.ok(row.toSettlementJSON())
  }
}
