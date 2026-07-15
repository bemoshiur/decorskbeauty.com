import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

const payload = await getPayload({ config })

const dir = 'Products'
const photo = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith('.jpeg'))
if (!photo) throw new Error('no photo found in Products/')

const doc = await payload.create({
  collection: 'media',
  data: { alt: 'smoke test' },
  filePath: path.resolve(dir, photo),
})

const sizes = (doc as { sizes?: Record<string, { filename?: string; mimeType?: string; width?: number }> }).sizes || {}
console.log('SMOKE file:', photo)
console.log('SMOKE id:', doc.id)
console.log('SMOKE sizes:', Object.entries(sizes).map(([k, v]) => `${k}:${v?.width}px/${v?.mimeType}`).join('  '))
console.log('SMOKE blur present:', Boolean((doc as { blurDataURL?: string }).blurDataURL))

// clean up the smoke doc so it doesn't pollute the catalog
await payload.delete({ collection: 'media', id: doc.id })
console.log('SMOKE cleaned up')
process.exit(0)
