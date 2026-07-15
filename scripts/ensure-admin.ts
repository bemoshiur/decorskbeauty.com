import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Ensure an owner admin exists for /admin. Credentials come ONLY from env (ADMIN_EMAIL,
 * ADMIN_PASSWORD) — never hardcoded, so nothing sensitive lives in the repo. Set a strong password
 * and change it after first login.
 */
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.')
  process.exit(1)
}
const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
if (existing.docs.length) {
  console.log(`owner already exists: ${email}`)
} else {
  await payload.create({ collection: 'users', data: { email, password, roles: ['owner'] }, overrideAccess: true })
  console.log(`created owner: ${email}`)
}
process.exit(0)
