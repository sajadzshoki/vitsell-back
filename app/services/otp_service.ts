import { DateTime } from 'luxon'
import OtpChallenge from '#models/otp_challenge'
import KavenegarService from '#services/kavenegar_service'

const OTP_TTL_MINUTES = 2
const OTP_LENGTH = 5

export type OtpPurpose = 'login' | 'phone_change'

export default class OtpService {
  constructor(private kavenegar = new KavenegarService()) {}

  private generateCode() {
    const max = 10 ** OTP_LENGTH
    const n = Math.floor(Math.random() * max)
    return String(n).padStart(OTP_LENGTH, '0')
  }

  async request(phone: string, purpose: OtpPurpose = 'login') {
    const code = this.generateCode()
    await OtpChallenge.query().where('phone', phone).where('purpose', purpose).delete()

    await OtpChallenge.create({
      phone,
      purpose,
      code,
      attempts: 0,
      expiresAt: DateTime.now().plus({ minutes: OTP_TTL_MINUTES }),
    })

    const send = await this.kavenegar.sendOtp(phone, code)
    return {
      expiresIn: OTP_TTL_MINUTES * 60,
      code,
      mocked: send.mocked === true,
    }
  }

  async verify(phone: string, code: string, purpose: OtpPurpose = 'login') {
    const challenge = await OtpChallenge.query()
      .where('phone', phone)
      .where('purpose', purpose)
      .orderBy('id', 'desc')
      .first()

    if (!challenge) {
      return { ok: false as const, reason: 'not_found' as const }
    }

    if (challenge.expiresAt < DateTime.now()) {
      await challenge.delete()
      return { ok: false as const, reason: 'expired' as const }
    }

    if (challenge.attempts >= 5) {
      await challenge.delete()
      return { ok: false as const, reason: 'too_many' as const }
    }

    if (challenge.code !== code) {
      challenge.attempts += 1
      await challenge.save()
      return { ok: false as const, reason: 'invalid' as const }
    }

    await challenge.delete()
    return { ok: true as const }
  }
}
