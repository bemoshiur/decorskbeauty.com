import { getPayload } from 'payload'
import config from '@payload-config'

import { ensureAccounts } from '../src/lib/accounting/accounts'

/**
 * Seed the chart of accounts (§12.1). Idempotent — adds any missing account, never renumbers.
 * Dev/test path; production seeds via migration. Run: `pnpm payload run scripts/seed-accounts.ts`.
 */
const payload = await getPayload({ config })
await ensureAccounts(payload)
const { totalDocs } = await payload.count({ collection: 'accounts' })
console.log(`Chart of accounts ready — ${totalDocs} accounts.`)
process.exit(0)
