import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

/**
 * Kavenegar verify/lookup OTP sender.
 * Without API key (local): logs the code to console.
 */
export default class KavenegarService {
  async sendOtp(phone: string, code: string) {
    const apiKey = env.get('KAVENEGAR_API_KEY')
    const template = env.get('KAVENEGAR_OTP_TEMPLATE') || 'digishop-verify'

    if (!apiKey) {
      logger.info({ phone, code }, '[Kavenegar] API key missing — OTP logged for local dev')
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
