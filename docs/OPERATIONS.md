# Operations — Decor's K-Beauty

Operational runbooks for the Phase 9 hardening items that are procedures, not code paths.

## Production migrations (§2.1 — `push: false` in prod)

Production runs with `push: false`, so the schema is created/updated **only** by migrations —
Payload will not auto-sync tables. The baseline migration (all 95 tables/enums) is committed at
`src/migrations/20260715_220439_initial.ts`.

**Do NOT run `pnpm migrate` in the Vercel build command against a database that already has the
schema** (e.g. the dev DB that was built via push): the baseline migration would try to re-create
existing tables and the whole build fails, so Vercel keeps serving the last good build. The default
build command (`pnpm build`) is correct for an already-provisioned DB. Run `pnpm migrate` (once,
manually or as a one-off build command) only against a **fresh, empty** database.

**Deploy against a FRESH prod database (recommended):** set `DATABASE_URL` to a new, empty Neon
database. Vercel's build runs `pnpm migrate` → creates the whole schema → builds. Clean separation of
dev and prod data. This is the intended path.

**Reusing the existing (push-built) dev DB instead:** that database has the schema but no
`payload_migrations` record, so `pnpm migrate` would try to re-create existing tables and fail.
Either (a) point prod at a fresh DB (above), or (b) baseline it once —
`psql "$DATABASE_URL" -c "INSERT INTO payload_migrations (name, batch) VALUES ('20260715_220439_initial', 1)"` —
so migrate treats the baseline as already applied.

**Adding a schema change later:** in dev (push) it applies automatically; then run
`pnpm migrate:create <name>` to generate the migration, commit it, and the next deploy applies it.

## Media storage in production (Vercel Blob)

Uploaded images are served from `/api/media/file/...`. Locally (no `BLOB_READ_WRITE_TOKEN`) they live
on disk. **On Vercel (serverless) there is no persistent disk**, so set `BLOB_READ_WRITE_TOKEN` — the
config already enables `vercelBlobStorage` when it's present, and media then serves from Blob (absolute
URLs that always load). The seeded product images live on the local dev disk only; re-upload them (or
run the media seed) once Blob is configured, or images will 404 in production. **Also replace the seed
product photos** — they have a purple studio background with price/code text baked in; clean shots are
needed for a launch-quality look.

## Backup & restore drill (§19 Phase 9)

Neon provides continuous backups + point-in-time restore (PITR) on the branch. That is the primary
recovery path. In addition, take a weekly logical dump so a bad migration or a bulk-delete is
recoverable independently of Neon:

```bash
# Weekly logical backup (run from a trusted machine / a scheduled job with the pooled OFF host).
pg_dump "$DATABASE_URL_DIRECT" --no-owner --no-privileges -Fc -f "dkb-$(date +%F).dump"
# Restore into a fresh Neon branch, verify, then promote:
pg_restore --no-owner --no-privileges -d "$RESTORE_URL" "dkb-2026-07-15.dump"
```

Use the **direct** (non-pooler) connection string for `pg_dump`/`pg_restore` — the pooler drops long
sessions. **Drill quarterly:** restore last week's dump into a scratch branch, boot the app against
it, confirm the admin loads and a trial balance still ties (`computeTrialBalance`). A backup you have
never restored is not a backup.

## Load test (§19 Phase 9)

Target the read paths that ISR protects (PDP/PLP) and the one hot write path (OTP → place). Budget:
PDP p75 LCP < 2.0s on 4G (§15.1). Example with [k6](https://k6.io):

```js
import http from 'k6/http'
import { check } from 'k6'
export const options = { stages: [{ duration: '1m', target: 50 }, { duration: '3m', target: 200 }, { duration: '1m', target: 0 }] }
export default function () {
  const r = http.get(`${__ENV.SITE}/products/${__ENV.SLUG}`)
  check(r, { '200': (x) => x.status === 200, 'fast': (x) => x.timings.duration < 800 })
}
```

Run against a Vercel **preview**, never production. Watch Neon connection count (pooled cap) and
Vercel function duration. The crons (`release-stale`, `expiry-scan`, `courier-sync`) are the other
load source — confirm they finish within `maxDuration` at 1,500-SKU scale.

## Staff 2FA (§17.2)

`owner` and `accounts` roles must enable 2FA before go-live. Payload supports TOTP via the auth
config; enable it on the `users` collection and enforce for those two roles. Tracked as a go-live
gate (not yet enforced in code).

## Cron secrets

All cron routes (`courier-sync`, `capi-drain`, `sku-parity`, `release-stale`, `expiry-scan`) require
`CRON_SECRET` as a Bearer header (constant-time compared). Set it in Vercel; Vercel Cron sends it
automatically. Without it every cron returns 401 and the reconciling/expiry/abandoned-release jobs
silently stop — set it as part of go-live.
