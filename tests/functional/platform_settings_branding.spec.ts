import { test } from '@japa/runner'
import User from '#models/user'
import {
  loadPlatformSettings,
  mergePlatformSettingsUpdate,
  savePlatformSettings,
} from '#utils/platform_settings'

async function bearerFor(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

test.group('Platform settings branding images', (group) => {
  group.tap((t) => t.tags(['settings', 'branding']))

  test('mergePlatformSettingsUpdate clears null image fields', async ({ assert }) => {
    const current = await loadPlatformSettings()
    await savePlatformSettings({
      ...current,
      logoUrl: 'https://cdn.example/logo.png',
      faviconUrl: 'https://cdn.example/favicon.ico',
      defaultOgImage: 'https://cdn.example/og.jpg',
    })

    const before = await loadPlatformSettings()
    assert.equal(before.logoUrl, 'https://cdn.example/logo.png')

    const raw = {
      brandName: before.brandName,
      logoUrl: null,
      faviconUrl: null,
      defaultOgImage: null,
    }
    // Simulate Vine dropping nulls from validated payload
    const payload = { brandName: before.brandName }

    const merged = mergePlatformSettingsUpdate(before, payload, raw)
    assert.equal(merged.logoUrl, '')
    assert.equal(merged.faviconUrl, '')
    assert.equal(merged.defaultOgImage, '')
  })

  test('PUT /seller/settings clears logoUrl faviconUrl defaultOgImage when null', async ({
    client,
    assert,
  }) => {
    const admin = await User.updateOrCreate(
      { phone: '09191118888' },
      { phone: '09191118888', role: 'admin' },
    )
    const token = await bearerFor(admin)

    const seed = await client
      .put('/api/v1/seller/settings')
      .bearerToken(token)
      .json({
        logoUrl: 'https://cdn.example/seed-logo.png',
        faviconUrl: 'https://cdn.example/seed-favicon.ico',
        defaultOgImage: 'https://cdn.example/seed-og.jpg',
      })
    seed.assertStatus(200)
    assert.equal(seed.body().logoUrl, 'https://cdn.example/seed-logo.png')
    assert.equal(seed.body().faviconUrl, 'https://cdn.example/seed-favicon.ico')
    assert.equal(seed.body().defaultOgImage, 'https://cdn.example/seed-og.jpg')

    const cleared = await client
      .put('/api/v1/seller/settings')
      .bearerToken(token)
      .json({
        logoUrl: null,
        faviconUrl: null,
        defaultOgImage: null,
      })
    cleared.assertStatus(200)
    assert.equal(cleared.body().logoUrl, '')
    assert.equal(cleared.body().faviconUrl, '')
    assert.equal(cleared.body().defaultOgImage, '')

    const reload = await client.get('/api/v1/seller/settings').bearerToken(token)
    reload.assertStatus(200)
    assert.equal(reload.body().logoUrl, '')
    assert.equal(reload.body().faviconUrl, '')
    assert.equal(reload.body().defaultOgImage, '')
  })

  test('PUT /seller/settings clears when only empty string sent', async ({ client, assert }) => {
    const admin = await User.updateOrCreate(
      { phone: '09191118888' },
      { phone: '09191118888', role: 'admin' },
    )
    const token = await bearerFor(admin)

    await client
      .put('/api/v1/seller/settings')
      .bearerToken(token)
      .json({ logoUrl: 'https://cdn.example/again.png' })
      .then((r) => r.assertStatus(200))

    // bodyparser convertEmptyStringsToNull → null on server
    const cleared = await client
      .put('/api/v1/seller/settings')
      .bearerToken(token)
      .json({ logoUrl: '' })
    cleared.assertStatus(200)
    assert.equal(cleared.body().logoUrl, '')
  })
})
