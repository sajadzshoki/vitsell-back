/*
|--------------------------------------------------------------------------
| Production fail-closed verification runner
|--------------------------------------------------------------------------
*/

process.env.NODE_ENV = 'production'
process.env.ALLOW_OTP_MOCK = 'false'
process.env.ALLOW_PAYMENT_MOCK = 'false'
process.env.KAVENEGAR_API_KEY = ''
process.env.ZARINPAL_MERCHANT_ID = ''

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const results: { name: string; ok: boolean; detail: string }[] = []

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}: ${detail}`)
}

async function main() {
  const app = new Ignitor(APP_ROOT, { importer: IMPORTER }).createApp('web')
  await app.init()
  await app.boot()

  const env = (await import('#start/env')).default
  record('env.NODE_ENV', env.get('NODE_ENV') === 'production', `NODE_ENV=${env.get('NODE_ENV')}`)
  record(
    'env.ALLOW_OTP_MOCK',
    env.get('ALLOW_OTP_MOCK') !== true,
    `ALLOW_OTP_MOCK=${String(env.get('ALLOW_OTP_MOCK'))}`
  )
  record(
    'env.ALLOW_PAYMENT_MOCK',
    env.get('ALLOW_PAYMENT_MOCK') !== true,
    `ALLOW_PAYMENT_MOCK=${String(env.get('ALLOW_PAYMENT_MOCK'))}`
  )
  record('env.KAVENEGAR_API_KEY empty', !env.get('KAVENEGAR_API_KEY'), 'empty')
  record('env.ZARINPAL_MERCHANT_ID empty', !env.get('ZARINPAL_MERCHANT_ID'), 'empty')

  const { default: KavenegarService, OtpUnavailableError } = await import(
    '#services/kavenegar_service'
  )
  const { default: ZarinpalService, PaymentUnavailableError } = await import(
    '#services/zarinpal_service'
  )
  const OtpService = (await import('#services/otp_service')).default

  try {
    await new OtpService().request('09121234567')
    record('OTP request fail-closed', false, 'otp.request unexpectedly succeeded')
  } catch (error) {
    record(
      'OTP request fail-closed',
      error instanceof OtpUnavailableError,
      error instanceof Error ? error.message : String(error)
    )
  }

  try {
    await new KavenegarService().sendOtp('09121234567', '12345')
    record('OTP kavenegar fail-closed', false, 'sendOtp unexpectedly succeeded')
  } catch (error) {
    record(
      'OTP kavenegar fail-closed',
      error instanceof OtpUnavailableError,
      error instanceof Error ? error.message : String(error)
    )
  }

  try {
    const result = await new ZarinpalService().requestPayment({
      amountRial: 10_000,
      description: 'verify-prod',
    })
    record(
      'Payment request fail-closed',
      false,
      `unexpected authority=${result.authority}`
    )
  } catch (error) {
    record(
      'Payment request fail-closed',
      error instanceof PaymentUnavailableError,
      error instanceof Error ? error.message : String(error)
    )
  }

  try {
    const result = await new ZarinpalService().verifyPayment({
      amountRial: 10_000,
      authority: 'SANDBOX-fake',
    })
    record(
      'Payment verify fail-closed',
      false,
      `unexpected ok=${result.ok} refId=${result.refId}`
    )
  } catch (error) {
    record(
      'Payment verify fail-closed',
      error instanceof PaymentUnavailableError,
      error instanceof Error ? error.message : String(error)
    )
  }

  // HTTP via AuthController directly (same code path as route)
  const AuthController = (await import('#controllers/auth_controller')).default
  const controller = new AuthController()

  const fakeResponse = {
    statusCode: 0 as number,
    body: null as unknown,
    serviceUnavailable(payload: unknown) {
      this.statusCode = 503
      this.body = payload
      return this
    },
    ok(payload: unknown) {
      this.statusCode = 200
      this.body = payload
      return this
    },
  }

  const fakeRequest = {
    async validateUsing() {
      return { phone: '09121234567' }
    },
  }

  await controller.requestOtp({
    request: fakeRequest,
    response: fakeResponse,
  } as never)

  const body = fakeResponse.body as Record<string, unknown> | null
  record(
    'OTP HTTP controller fail-closed',
    fakeResponse.statusCode === 503 && !(body && 'devCode' in body),
    `status=${fakeResponse.statusCode} body=${JSON.stringify(body)}`
  )

  await app.terminate()

  const failed = results.filter((r) => !r.ok)
  console.log('\n--- Summary ---')
  console.log(`passed=${results.length - failed.length} failed=${failed.length}`)
  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  process.exitCode = 1
  prettyPrintError(error)
})
