import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export class OtpUnavailableError extends Error {
  constructor(message = 'سرویس ارسال پیامک در دسترس نیست') {
    super(message)
    this.name = 'OtpUnavailableError'
  }
}

export type KavenegarLookupTokens = {
  token: string
  token2?: string
  token3?: string
  token10?: string
  token20?: string
}

export type KavenegarSendResult = {
  ok: boolean
  mocked: boolean
  skipped: boolean
}

/**
 * Kavenegar verify/lookup sender (OTP and order notices).
 * Mock only when NODE_ENV !== production AND ALLOW_OTP_MOCK === true.
 * OTP uses failClosed so login cannot proceed without a real or mocked send.
 * Order notices leave failClosed off and never throw.
 */
export default class KavenegarService {
  private allowMock() {
    return env.get('NODE_ENV') !== 'production' && env.get('ALLOW_OTP_MOCK') === true
  }

  async sendOtp(phone: string, code: string) {
    const template = env.get('KAVENEGAR_OTP_TEMPLATE') || 'vitsell-verify'
    const result = await this.sendLookup(
      phone,
      template,
      { token: code },
      { failClosed: true }
    )
    return { ok: true as const, mocked: result.mocked }
  }

  async sendLookup(
    phone: string,
    template: string,
    tokens: KavenegarLookupTokens,
    options?: { failClosed?: boolean }
  ): Promise<KavenegarSendResult> {
    const failClosed = options?.failClosed === true
    const apiKey = env.get('KAVENEGAR_API_KEY')
    const templateName = template.trim()

    if (!templateName) {
      return this.unavailable(phone, 'قالب پیامک کاوه‌نگار تنظیم نشده', failClosed)
    }

    if (!apiKey) {
      if (!this.allowMock()) {
        return this.unavailable(
          phone,
          'KAVENEGAR_API_KEY تنظیم نشده و mock OTP غیرفعال است',
          failClosed
        )
      }
      logger.info(
        { phone, template: templateName, tokens },
        '[Kavenegar] API key missing — SMS logged (ALLOW_OTP_MOCK)'
      )
      return { ok: true, mocked: true, skipped: false }
    }

    const body = new URLSearchParams({
      receptor: phone,
      template: templateName,
      token: tokens.token,
    })
    if (tokens.token2) body.set('token2', tokens.token2)
    if (tokens.token3) body.set('token3', tokens.token3)
    if (tokens.token10) body.set('token10', tokens.token10)
    if (tokens.token20) body.set('token20', tokens.token20)

    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(8000),
      })

      const data = (await response.json()) as {
        return?: { status?: number; message?: string }
      }

      if (!response.ok || (data.return?.status && data.return.status >= 400)) {
        const message = data.return?.message || 'Kavenegar send failed'
        logger.error({ phone, template: templateName, data }, '[Kavenegar] send failed')
        if (failClosed) throw new Error(message)
        return { ok: false, mocked: false, skipped: true }
      }

      return { ok: true, mocked: false, skipped: false }
    } catch (error) {
      if (failClosed) throw error
      const message = error instanceof Error ? error.message.replaceAll(apiKey, '***') : 'send failed'
      logger.error({ phone, template: templateName, message }, '[Kavenegar] send failed')
      return { ok: false, mocked: false, skipped: true }
    }
  }

  private unavailable(phone: string, message: string, failClosed: boolean): KavenegarSendResult {
    if (failClosed) throw new OtpUnavailableError(message)
    logger.warn({ phone }, `[Kavenegar] ${message}`)
    return { ok: false, mocked: false, skipped: true }
  }
}
