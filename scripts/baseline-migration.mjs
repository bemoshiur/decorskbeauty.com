// One-off: baseline an existing (dev-pushed) DB so Payload's migrator treats the initial schema as
// already applied. Records the initial migration in payload_migrations WITHOUT running it, so a
// subsequent `pnpm migrate` only applies the NEW (content_models) migration. Idempotent.
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createPool } from '@vercel/postgres'

const INITIAL = process.argv[2] || '20260715_220439_initial'
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

const pool = createPool({ connectionString: url })
try {
  const { rows } = await pool.query('SELECT name FROM payload_migrations ORDER BY id')
  console.log('recorded migrations:', rows.map((r) => r.name).join(', ') || '(none)')
  if (rows.some((r) => r.name === INITIAL)) {
    console.log(`already baselined: ${INITIAL}`)
  } else {
    await pool.query(
      'INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ($1, $2, now(), now())',
      [INITIAL, 1],
    )
    console.log(`baselined: ${INITIAL}`)
  }
} catch (e) {
  console.error('baseline failed:', e?.message)
  process.exit(1)
} finally {
  await pool.end()
}
