// One-off: migrate locally-seeded media files into the Vercel Blob store so production serves them.
// Key = exact filename (no random suffix) to match how @payloadcms/storage-vercel-blob serves them.
import { config } from 'dotenv'
config({ path: '.env.local' })
import { put } from '@vercel/blob'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) { console.error('BLOB_READ_WRITE_TOKEN not set'); process.exit(1) }

const dir = process.argv[2] || 'media'
const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile() && !f.startsWith('.'))
console.log(`uploading ${files.length} files from ${dir}/ → Vercel Blob…`)

let ok = 0, fail = 0
for (const f of files) {
  try {
    const buf = readFileSync(join(dir, f))
    await put(f, buf, { access: 'public', token, addRandomSuffix: false, allowOverwrite: true })
    ok++
  } catch (e) {
    fail++
    console.error('  FAIL', f, e?.message)
  }
}
console.log(`done — uploaded ${ok}, failed ${fail}`)
process.exit(fail ? 1 : 0)
