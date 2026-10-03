import { test } from '@japa/runner'
import AdminRole from '#models/admin_role'
import Profile from '#models/profile'
import User from '#models/user'
import { ensureSystemAdminRoles, syncUserAdminRoles } from '#utils/seller_admins'

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function adminToken() {
  const admin = await User.updateOrCreate(
    { phone: '09193330991' },
    { phone: '09193330991', role: 'admin', status: 'active' }
  )
  await ensureSystemAdminRoles()
  const superRole = await AdminRole.findByOrFail('key', 'SUPER_ADMIN')
  await syncUserAdminRoles(admin, [superRole])
  return bearerFor(admin)
}

test.group('Courier from existing shop user', (group) => {
  group.tap((t) => t.tags(['courier']))

  test('adds courier access without changing shop account', async ({ client, assert }) => {
    const stamp = Date.now()
    const suffix = String(stamp).slice(-8)
    const customerPhone = `0917${suffix}`.slice(0, 11)

    const token = await adminToken()
    const customer = await User.create({
      phone: customerPhone,
      role: 'customer',
      status: 'active',
      password: null,
    })
    await Profile.create({
      userId: customer.id,
      firstName: 'علی',
      lastName: 'خریدار',
      email: 'ali@test.local',
      birth: null,
      gender: null,
      avatar: null,
    })

    const created = await client
      .post('/api/v1/seller/couriers')
      .bearerToken(token)
      .json({ name: 'پیک تست', phone: customerPhone })

    created.assertStatus(201)
    assert.equal(created.body().shopAccount, true)
    assert.equal(created.body().status, 'active')
    assert.equal(created.body().name, 'پیک تست')

    await customer.refresh()
    await customer.load('profile')
    assert.equal(customer.role, 'customer')
    assert.equal(customer.status, 'active')
    assert.equal(customer.phone, customerPhone)
    assert.equal(customer.isCourier, true)
    assert.equal(customer.courierActive, true)
    assert.equal(customer.profile.firstName, 'علی')
    assert.equal(customer.profile.lastName, 'خریدار')
    assert.equal(customer.profile.email, 'ali@test.local')
  })

  test('deactivating courier does not block the shop user', async ({ client, assert }) => {
    const stamp = Date.now()
    const suffix = String(stamp).slice(-8)
    const customerPhone = `0916${suffix}`.slice(0, 11)
    const token = await adminToken()
    const customer = await User.create({
      phone: customerPhone,
      role: 'customer',
      status: 'active',
      password: null,
    })

    const created = await client
      .post('/api/v1/seller/couriers')
      .bearerToken(token)
      .json({ name: 'پیک', phone: customerPhone })
    created.assertStatus(201)

    const patched = await client
      .patch(`/api/v1/seller/couriers/${created.body().id}/status`)
      .bearerToken(token)
      .json({ status: 'inactive' })
    patched.assertStatus(200)
    assert.equal(patched.body().status, 'inactive')

    await customer.refresh()
    assert.equal(customer.role, 'customer')
    assert.equal(customer.status, 'active')
    assert.equal(customer.courierActive, false)
  })
})
