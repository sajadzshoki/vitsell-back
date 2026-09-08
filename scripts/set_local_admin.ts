/**
 * One-off: promote phone to admin and set password for local testing.
 * Usage: node ace exec scripts/set_local_admin.ts
 * Or: docker compose exec api node --import=@poppinss/ts-exec scripts/set_local_admin.ts
 */
import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const ignitor = new Ignitor(APP_ROOT, {
  importer: (filePath) => {
    if (filePath.startsWith('./') || filePath.startsWith('../')) {
      return import(new URL(filePath, APP_ROOT).href)
    }
    return import(filePath)
  },
})

try {
  const app = ignitor.createApp('console')
  await app.init()
  await app.boot()
  await app.start(() => {})

  const { default: User } = await import('#models/user')
  const phone = process.env.ADMIN_PHONE || '09121234567'
  const password = process.env.ADMIN_PASSWORD || 'Admin1234'

  let user = await User.findBy('phone', phone)
  if (!user) {
    user = await User.create({ phone, role: 'admin', password })
  } else {
    user.role = 'admin'
    user.password = password
    await user.save()
  }

  console.log(
    JSON.stringify({
      ok: true,
      phone: user.phone,
      role: user.role,
      hasPassword: Boolean(user.password),
      passwordHint: password,
    })
  )
  await app.terminate()
} catch (error) {
  await prettyPrintError(error)
  process.exit(1)
}
