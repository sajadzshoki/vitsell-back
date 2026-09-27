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

/** Official sandbox accepts any 36-char merchant code. */
const SANDBOX_MERCHANT_FALLBACK = '00000000-0000-0000-0000-000000000000'

export class PaymentUnavailableError extends Error {
  constructor(message = 'درگاه پرداخت در دسترس نیست') {
    super(message)
    this.name = 'PaymentUnavailableError'
  }
}

/**
 * Zarinpal payment gateway v4.
 * Amounts stored/passed here are Rials (frontend toman × 10).
 *
 * Live host: payment.zarinpal.com (api.zarinpal.com is deprecated).
 * Sandbox only when ZARINPAL_SANDBOX=true explicitly.
 */
export default class ZarinpalService {
  private sandbox() {
    return env.get('ZARINPAL_SANDBOX') === true
  }

  private merchantId() {
    const configured = (env.get('ZARINPAL_MERCHANT_ID') || '').trim()
    if (configured) return configured
    if (this.sandbox()) return SANDBOX_MERCHANT_FALLBACK
    return ''
  }

  private baseApi() {
    return this.sandbox()
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://payment.zarinpal.com/pg/v4/payment'
  }

  private startPayBase() {
    return this.sandbox()
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://payment.zarinpal.com/pg/StartPay'
  }

  /** Avoid 0.0.0.0 in browser-facing callback URLs. */
  private publicAppUrl() {
    return env
      .get('APP_URL')
      .replace(/\/\/0\.0\.0\.0(?=[:/]|$)/, '//localhost')
      .replace(/\/\/\[::\](?=[:/]|$)/, '//localhost')
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
      `${this.publicAppUrl()}/api/v1/payments/zarinpal/callback`

    const amountRial = Math.round(Number(input.amountRial) || 0)
    if (amountRial < 1000) {
      throw new Error('مبلغ پرداخت کمتر از حداقل زرین‌پال است')
    }

    // Local mock only when merchant missing and mock explicitly allowed.
    if (!merchantId) {
      if (env.get('ALLOW_PAYMENT_MOCK') === true && env.get('NODE_ENV') !== 'production') {
        const authority = `MOCK${Date.now()}${Math.floor(Math.random() * 1e6)}`
        logger.info(
          { authority, amountRial },
          '[Zarinpal] mock authority for local dev'
        )
        return {
          authority,
          paymentUrl: `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}Authority=${authority}&Status=OK&mock=1`,
        }
      }
      throw new PaymentUnavailableError('ZARINPAL_MERCHANT_ID تنظیم نشده است')
    }

    logger.info(
      {
        sandbox: this.sandbox(),
        amountRial,
        callbackUrl,
        merchant: `${merchantId.slice(0, 8)}…`,
      },
      '[Zarinpal] payment request'
    )

    const response = await fetch(`${this.baseApi()}/request.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountRial,
        currency: 'IRR',
        description: input.description,
        callback_url: callbackUrl,
        metadata: input.mobile ? { mobile: input.mobile } : undefined,
      }),
    })

    const payload = (await response.json()) as {
      data?: { code?: number; authority?: string; message?: string }
      errors?: { code?: number; message?: string } | Array<{ code?: number; message?: string }>
    }

    if (!payload.data?.authority || payload.data.code !== 100) {
      logger.error({ payload, status: response.status }, '[Zarinpal] request failed')
      const errMsg = zarinpalErrorMessage(payload) || payload.data?.message || 'Zarinpal request failed'
      throw new Error(errMsg)
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
    const amountRial = Math.round(Number(input.amountRial) || 0)
    const authority = String(input.authority || '').trim()

    if (!merchantId || authority.startsWith('MOCK')) {
      if (authority.startsWith('MOCK')) {
        logger.info({ authority }, '[Zarinpal] mock verify OK')
        return {
          ok: true,
          code: 100,
          refId: `MOCK-${Date.now()}`,
          cardPan: '502229******0000',
        }
      }
      return {
        ok: false,
        code: -1,
        message: 'ZARINPAL_MERCHANT_ID تنظیم نشده است',
      }
    }

    logger.info(
      { sandbox: this.sandbox(), amountRial, authority: `${authority.slice(0, 12)}…` },
      '[Zarinpal] verify request'
    )

    const response = await fetch(`${this.baseApi()}/verify.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountRial,
        authority,
      }),
    })

    const payload = (await response.json()) as {
      data?: {
        code?: number
        message?: string
        ref_id?: number | string
        card_pan?: string
      }
      errors?: { code?: number; message?: string } | Array<{ code?: number; message?: string }>
    }

    const code = Number(payload.data?.code ?? zarinpalErrorCode(payload) ?? 0)
    const ok = code === 100 || code === 101

    if (!ok) {
      logger.error({ payload, status: response.status, amountRial, authority }, '[Zarinpal] verify failed')
    } else {
      logger.info({ code, refId: payload.data?.ref_id }, '[Zarinpal] verify OK')
    }

    return {
      ok,
      code,
      message: payload.data?.message || zarinpalErrorMessage(payload),
      refId: payload.data?.ref_id != null ? String(payload.data.ref_id) : undefined,
      cardPan: payload.data?.card_pan,
    }
  }
}

function zarinpalErrorCode(payload: {
  errors?: { code?: number; message?: string } | Array<{ code?: number; message?: string }>
}): number | undefined {
  const errors = payload.errors
  if (Array.isArray(errors)) return errors[0]?.code
  if (errors && typeof errors === 'object') return errors.code
  return undefined
}

function zarinpalErrorMessage(payload: {
  errors?: { code?: number; message?: string } | Array<{ code?: number; message?: string }>
}): string | undefined {
  const errors = payload.errors
  if (Array.isArray(errors)) return errors[0]?.message
  if (errors && typeof errors === 'object') return errors.message
  return undefined
}
