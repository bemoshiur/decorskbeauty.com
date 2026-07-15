import { NextResponse, type NextRequest } from 'next/server'

import type { Product, Variant } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { effectivePrice } from '@/lib/commerce/products'
import { computeCheckoutTerms, type Zone } from '@/lib/commerce/checkout'

const ZONES: Zone[] = ['dhakaCity', 'dhakaSub', 'outside']

/**
 * Live delivery/advance/COD quote for the on-PDP order form. computeCheckoutTerms is the ONLY source
 * of these numbers (#3) — the form never computes them client-side. Public (a price quote, no PII).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { variantId?: number; qty?: number; zone?: string }
  const qty = Math.max(1, Math.min(99, Math.floor(Number(body.qty) || 1)))
  const zone = (ZONES.includes(body.zone as Zone) ? body.zone : 'dhakaCity') as Zone
  if (!body.variantId) return NextResponse.json({ ok: false, error: 'Missing product.' }, { status: 400 })

  const payload = await getPayloadClient()
  const variant = (await payload.findByID({ collection: 'variants', id: body.variantId, depth: 1, overrideAccess: true }).catch(() => null)) as Variant | null
  if (!variant || variant.active === false) return NextResponse.json({ ok: false, error: 'Product unavailable.' }, { status: 404 })

  const product = variant.product && typeof variant.product === 'object' ? (variant.product as Product) : null
  const unitPrice = effectivePrice(variant)
  const isPreOrder = product?.fulfilmentMode === 'preOrder'
  const terms = computeCheckoutTerms({ lines: [{ unitPrice, qty, isPreOrder }] }, zone)

  return NextResponse.json({ ok: true, unitPrice, terms })
}
