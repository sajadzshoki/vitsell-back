import { test } from '@japa/runner'
import { irMobile, placedOrderMessage, readyToShipMessage } from '#utils/order_sms'

test.group('order sms text', () => {
  test('builds a plain placed message with order id, delivery code, and amount', ({ assert }) => {
    const amount = (1_500_000).toLocaleString('fa-IR')
    assert.equal(
      placedOrderMessage({ orderId: 'BZ-123456', deliveryCode: '042831', total: 1500000 }),
      ['ویتسل', 'سفارش BZ-123456 ثبت شد.', 'کد تحویل: 042831', `مبلغ: ${amount} تومان`].join('\n')
    )
  })

  test('ready message keeps tracking only when it exists', ({ assert }) => {
    assert.equal(
      readyToShipMessage({ orderId: 'BZ-123456', deliveryCode: '042831', trackingCode: 'IR-99 10' }),
      ['ویتسل', 'سفارش BZ-123456 آماده ارسال است.', 'کد تحویل: 042831', 'کد پیگیری: IR-99 10'].join('\n')
    )
    assert.equal(
      readyToShipMessage({ orderId: 'BZ-123456', deliveryCode: '042831' }),
      ['ویتسل', 'سفارش BZ-123456 آماده ارسال است.', 'کد تحویل: 042831'].join('\n')
    )
  })

  test('normalizes iranian mobiles', ({ assert }) => {
    assert.equal(irMobile('09121234567'), '09121234567')
    assert.equal(irMobile('+989121234567'), '09121234567')
    assert.equal(irMobile('9121234567'), '09121234567')
    assert.equal(irMobile('02112345678'), '')
  })
})