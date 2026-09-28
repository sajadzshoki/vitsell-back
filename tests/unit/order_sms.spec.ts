import { test } from '@japa/runner'
import { irMobile, kavenegarLookupToken } from '#utils/order_sms'

test.group('order sms tokens', () => {
  test('strips separators kavenegar lookup rejects', ({ assert }) => {
    assert.equal(kavenegarLookupToken('BZ-123456', '0'), 'BZ123456')
    assert.equal(kavenegarLookupToken('TR_12 34', 'ندارد'), 'TR1234')
    assert.equal(kavenegarLookupToken('---', 'ندارد'), 'ندارد')
    assert.equal(kavenegarLookupToken('۱۲۳۴۵۶', '0'), '123456')
  })

  test('normalizes iranian mobiles', ({ assert }) => {
    assert.equal(irMobile('09121234567'), '09121234567')
    assert.equal(irMobile('+989121234567'), '09121234567')
    assert.equal(irMobile('9121234567'), '09121234567')
    assert.equal(irMobile('02112345678'), '')
  })
})