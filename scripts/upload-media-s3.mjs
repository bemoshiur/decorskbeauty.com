// One-off: migrate locally-seeded media files into the S3 bucket so production serves them.
// Key = exact filename (no prefix, no random suffix) to match how @payloadcms/storage-s3 with
// `collections: { media: true }` (empty prefix) serves them and how the DB rows reference them.
// Usage: node scripts/upload-media-s3.mjs [dir]   (reads S3_BUCKET / S3_REGION / S3 creds from .env.local)
import { config } from 'dotenv'
config({ path: '.env.local' })
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'

const Bucket = process.env.S3_BUCKET
if (!Bucket) { console.error('S3_BUCKET not set'); process.exit(1) }

const s3 = new S3Client({
  region: process.env.S3_REGION,
  ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? { credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }
    : {}),
})

// Explicit Content-Type so objects are correct even if served straight from S3/CloudFront later.
const CT = { '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' }

const dir = process.argv[2] || 'media'
const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile() && !f.startsWith('.'))
console.log(`uploading ${files.length} files from ${dir}/ → s3://${Bucket} (region ${process.env.S3_REGION})…`)

let ok = 0, fail = 0
for (const f of files) {
  try {
    await s3.send(new PutObjectCommand({
      Bucket,
      Key: f, // exact filename, no prefix / no random suffix
      Body: readFileSync(join(dir, f)),
      ContentType: CT[extname(f).toLowerCase()] || 'application/octet-stream',
    }))
    ok++
  } catch (e) {
    fail++
    console.error('  FAIL', f, e?.message)
  }
}
console.log(`done — uploaded ${ok}, failed ${fail}`)
process.exit(fail ? 1 : 0)
