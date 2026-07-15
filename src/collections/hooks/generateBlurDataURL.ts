import type { CollectionBeforeChangeHook } from 'payload'
import sharp from 'sharp'

/**
 * Store a tiny base64 blur placeholder on upload so images can reserve space and fade in
 * without layout shift (CLS budget, §15.1/§15.3). Never fails the upload.
 */
export const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  try {
    if (operation !== 'create') return data
    const buffer = req.file?.data
    if (!buffer || !Buffer.isBuffer(buffer)) return data
    const tiny = await sharp(buffer).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()
    data.blurDataURL = `data:image/webp;base64,${tiny.toString('base64')}`
  } catch {
    // A missing placeholder must never block an upload.
  }
  return data
}
