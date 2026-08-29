import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

type ZarinpalRequestResult = {
  authority: string
  paymentUrl: string
}

type ZarinpalVerifyResult = {
  ok: boolean
  refId?: string
  cardPan?: string
  code: number
  message?: string
}

/**
 * Zarinpal payment gateway v4.
 * Amounts stored/passed here are Rials (frontend toman × 10).
 */
export default class ZarinpalService {
  private merchantId() {
    return env.get('ZARINPAL_MERCHANT_ID') || ''
  }

  private sandbox() {
    return env.get('ZARINPAL_SANDBOX') !== false
  }

  private baseApi() {
    return this.sandbox()
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment'
  }

  private startPayBase() {
    return this.sandbox()
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay'
  }

  async requestPayment(input: {
    amountRial: number
    description: string
    mobile?: string
    callbackUrl?: string
  }): Promise<ZarinpalRequestResult> {
    const merchantId = this.merchantId()
    const callbackUrl =
      input.callbackUrl ||
      env.get('ZARINPAL_CALLBACK_URL') ||
      `${env.get('APP_URL')}/api/v1/payments/zarinpal/callback`

    if (!merchantId) {
      const authority = `SANDBOX${Date.now()}${Math.floor(Math.random() * 1e6)}`
      logger.info(
        { authority, amountRial: input.amountRial },
        '[Zarinpal] merchant missing — mock authority for local dev'
      )
      return {
        authority,
        paymentUrl: `${env.get('APP_URL')}/api/v1/payments/zarinpal/callback?Authority=${authority}&Status=OK&mock=1`,
      }
    }

    const response = await fetch(`${this.baseApi()}/request.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: input.amountRial,
        description: input.description,
        callback_url: callbackUrl,
        metadata: input.mobile ? { mobile: input.mobile } : undefined,
      }),
    })

    const payload = (await response.json()) as {
      data?: { code?: number; authority?: string; message?: string }
      errors?: unknown
    }

    if (!payload.data?.authority || payload.data.code !== 100) {
      logger.error({ payload }, '[Zarinpal] request failed')
      throw new Error(payload.data?.message || 'Zarinpal request failed')
    }

    return {
      authority: payload.data.authority,
      paymentUrl: `${this.startPayBase()}/${payload.data.authority}`,
    }
  }

  async verifyPayment(input: {
    amountRial: number
    authority: string
  }): Promise<ZarinpalVerifyResult> {
    const merchantId = this.merchantId()

    if (!merchantId) {
      logger.info({ authority: input.authority }, '[Zarinpal] mock verify OK')
      return {
        ok: true,
        code: 100,
        refId: `MOCK-${Date.now()}`,
        cardPan: '502229******0000',
      }
    }

    const response = await fetch(`${this.baseApi()}/verify.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: input.amountRial,
        authority: input.authority,
      }),
    })

    const payload = (await response.json()) as {
      data?: {
        code?: number
        message?: string
        ref_id?: number | string
        card_pan?: string
      }
    }

    const code = payload.data?.code ?? 0
    const ok = code === 100 || code === 101

    return {
      ok,
      code,
      message: payload.data?.message,
      refId: payload.data?.ref_id != null ? String(payload.data.ref_id) : undefined,
      cardPan: payload.data?.card_pan,
    }
  }
}
