import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export class OtpUnavailableError extends Error {
  constructor(message = 'سرویس ارسال پیامک در دسترس نیست') {
    super(message)
    this.name = 'OtpUnavailableError'
  }
}

/**
 * Kavenegar verify/lookup OTP sender.
 * Mock only when NODE_ENV !== production AND ALLOW_OTP_MOCK === true.
 */
export default class KavenegarService {
  private allowMock() {
    return env.get('NODE_ENV') !== 'production' && env.get('ALLOW_OTP_MOCK') === true
  }

  async sendOtp(phone: string, code: string) {
    const apiKey = env.get('KAVENEGAR_API_KEY')
    const template = env.get('KAVENEGAR_OTP_TEMPLATE') || 'digishop-verify'

    if (!apiKey) {
      if (!this.allowMock()) {
        throw new OtpUnavailableError(
          'KAVENEGAR_API_KEY تنظیم نشده و mock OTP غیرفعال است'
        )
      }
      logger.info({ phone, code }, '[Kavenegar] API key missing — OTP logged (ALLOW_OTP_MOCK)')
      return { ok: true as const, mocked: true }
    }

    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`
    const body = new URLSearchParams({
      receptor: phone,
      token: code,
      template,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const data = (await response.json()) as {
      return?: { status?: number; message?: string }
    }

    if (!response.ok || (data.return?.status && data.return.status >= 400)) {
      logger.error({ phone, data }, '[Kavenegar] send failed')
      throw new Error(data.return?.message || 'Kavenegar send failed')
    }

    return { ok: true as const, mocked: false }
  }
}
