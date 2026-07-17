import crypto from 'crypto'
import { writeFileSync } from 'fs'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Provision the owner super-admin. Generates a strong password IN THIS SCRIPT (never printed to the
 * console), creates the owner if missing, and writes the credentials to ADMIN_CREDENTIALS.txt
 * (gitignored, local only). Run: pnpm payload run scripts/provision-admin.ts
 */
const email = process.env.ADMIN_EMAIL || 'admin@decorskbeauty.com'
// Pass ADMIN_URL to embed the real admin URL in the creds file (kept out of this public repo).
const url = process.env.ADMIN_URL || '<your-amplify-domain>/admin'
const password = 'Dkb-' + crypto.randomBytes(9).toString('base64url') + '-26'

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })

let action: string
if (existing.docs.length) {
  // Reset to a fresh known password + ensure owner role, so access is guaranteed.
  await payload.update({ collection: 'users', id: existing.docs[0].id, data: { password, roles: ['owner'] }, overrideAccess: true })
  action = 'reset password for existing owner'
} else {
  await payload.create({ collection: 'users', data: { email, password, roles: ['owner'] }, overrideAccess: true })
  action = 'created owner'
}

const body =
  `Decor's K-Beauty — Super Admin credentials\n` +
  `Generated: 2026-07-17 (${action})\n\n` +
  `Admin URL : ${url}\n` +
  `Email     : ${email}\n` +
  `Password  : ${password}\n\n` +
  `⚠ Change this password after first login (Account → change password).\n` +
  `This file is gitignored. Delete it once you've saved the credentials.\n`
writeFileSync('ADMIN_CREDENTIALS.txt', body)
console.log(`${action}: ${email}`)
console.log('credentials written to ADMIN_CREDENTIALS.txt (gitignored) — open that file for the password.')
process.exit(0)
