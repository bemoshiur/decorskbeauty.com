# Scheduled jobs (EventBridge Scheduler → Lambda → `/api/cron/*`)

The storefront's cron routes are HTTP endpoints guarded by `CRON_SECRET`. On Vercel these were driven by
`vercel.json` crons; on **AWS Amplify** there is no built-in scheduler, so we drive them with
**EventBridge Scheduler → a thin invoker Lambda ([`index.mjs`](./index.mjs)) → the route**.

## The routes and their cadence

| Route | Schedule | Why |
| --- | --- | --- |
| `/api/cron/courier-sync` | every 30 min | Courier webhooks get dropped in BD; the reconcile is not optional (see CLAUDE.md). |
| `/api/cron/capi-drain` | every 15 min | Drain queued Meta CAPI events promptly. |
| `/api/cron/release-stale` | every 30 min | `STALE_MINUTES = 60` — release an abandoned order's reservations within the hour. |
| `/api/cron/sku-parity` | daily 02:00 Asia/Dhaka | Audit the SKU spine (non-negotiable #1) for drift across feeds. |
| `/api/cron/expiry-scan` | daily 02:30 Asia/Dhaka | §10.3 near-expiry FEFO write-off + short-expiry flag. |

## Resources (region `ap-southeast-1`)

- **Lambda** `dkb-cron-invoker` (nodejs20.x, 128 MB, 120 s). Env: `APP_URL` (deployed origin, no trailing
  slash), `CRON_SECRET`. Execution role `dkb-cron-lambda-role` (AWSLambdaBasicExecutionRole).
- **Scheduler role** `dkb-cron-scheduler-role` — trusts `scheduler.amazonaws.com`, inline policy allows
  `lambda:InvokeFunction` on the function.
- **Schedule group** `dkb-cron` — one schedule per route above; each target passes `{"path":"/api/cron/…"}`.

> Account-scoped ARNs / IDs are intentionally omitted from this repo. Substitute `<ACCOUNT_ID>` and the real
> function ARN from the AWS console when re-provisioning.

## Re-provision / update

```sh
# repackage after editing index.mjs
zip -j cron-lambda.zip infra/cron-lambda/index.mjs
aws lambda update-function-code --function-name dkb-cron-invoker \
  --zip-file fileb://cron-lambda.zip --region ap-southeast-1

# rotate the secret or point at a new origin (env is set at create-time; update as needed)
aws lambda update-function-configuration --function-name dkb-cron-invoker --region ap-southeast-1 \
  --environment 'Variables={APP_URL=https://<origin>,CRON_SECRET=<secret>}'
```

When the custom domain goes live, update `APP_URL` to `https://decorskbeauty.com`.

## Verify

```sh
# one manual run against the safest (read-only) route
echo '{"path":"/api/cron/sku-parity"}' > /tmp/ev.json
aws lambda invoke --function-name dkb-cron-invoker --region ap-southeast-1 \
  --cli-binary-format raw-in-base64-out --payload file:///tmp/ev.json --log-type Tail /tmp/out.json
# expect payload {"ok":true,"path":"/api/cron/sku-parity","status":200}
```
