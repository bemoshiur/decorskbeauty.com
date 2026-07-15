import { unstable_cache } from 'next/cache'

import type { StockLot, Variant, Product, PurchaseOrder, Media } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { getFefoLot, type AllocatableLot, type LotStatus } from '@/lib/inventory/allocate'
import { CATALOG_TAG } from './tags'

const toAllocatable = (l: StockLot): AllocatableLot => ({
  id: l.id,
  expDate: (l.expDate as string) ?? '',
  receivedAt: (l.receivedAt as string) ?? '',
  qtyAvailable: l.qtyAvailable ?? 0,
  landedCostPerUnit: l.landedCostPerUnit ?? 0,
  status: (l.status ?? 'open') as LotStatus,
})

export type FefoLotView = {
  lotCode: string
  mfgDate?: string | null
  expDate?: string | null
  importDate?: string | null
  poRef?: string | null
}

const dateOnly = (v?: string | null) => (v ? String(v).slice(0, 10) : null)

/** The lot FEFO would ship next for this variant — powers the PDP EXP + authenticity slip (§10.2). */
export const getFefoLotForVariant = (variantId: number): Promise<FefoLotView | null> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'stockLots',
        where: { variant: { equals: variantId } },
        depth: 1,
        limit: 500,
      })
      const lots = docs as StockLot[]
      const chosen = getFefoLot(lots.map(toAllocatable), Date.now())
      if (!chosen) return null
      const lot = lots.find((l) => l.id === chosen.id)
      if (!lot) return null
      const po = lot.purchaseOrder && typeof lot.purchaseOrder === 'object' ? (lot.purchaseOrder as PurchaseOrder) : null
      return {
        lotCode: lot.lotCode,
        mfgDate: dateOnly(lot.mfgDate as string),
        expDate: dateOnly(lot.expDate as string),
        importDate: dateOnly(lot.receivedAt as string),
        poRef: po?.poNumber ?? null,
      }
    },
    ['fefo-lot', String(variantId)],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()

export type BatchVerification = {
  lotCode: string
  productTitle: string | null
  productSlug: string | null
  brandName: string | null
  mfgDate: string | null
  expDate: string | null
  importDate: string | null
  poRef: string | null
  docs: { url: string; label: string }[]
}

/** /verify (§6.2): resolve a batch code to product, MFG/EXP, import date + scanned docs. */
export async function verifyBatch(lotCode: string): Promise<BatchVerification | null> {
  const code = lotCode.trim()
  if (!code) return null
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'stockLots',
    where: { lotCode: { equals: code } },
    depth: 2,
    limit: 1,
  })
  const lot = docs[0] as StockLot | undefined
  if (!lot) return null

  const variant = lot.variant && typeof lot.variant === 'object' ? (lot.variant as Variant) : null
  const product = variant?.product && typeof variant.product === 'object' ? (variant.product as Product) : null
  const brand = product?.brand && typeof product.brand === 'object' ? product.brand : null
  const po = lot.purchaseOrder && typeof lot.purchaseOrder === 'object' ? (lot.purchaseOrder as PurchaseOrder) : null

  const importDocs = (lot.importDocs ?? []) as { doc?: number | Media; label?: string | null }[]
  const resolvedDocs = importDocs
    .map((d) => {
      const media = d.doc && typeof d.doc === 'object' ? (d.doc as Media) : null
      return media?.url ? { url: media.url, label: d.label || media.alt || 'Import document' } : null
    })
    .filter((x): x is { url: string; label: string } => x !== null)

  return {
    lotCode: lot.lotCode,
    productTitle: product?.title ?? null,
    productSlug: product?.slug ?? null,
    brandName: brand?.name ?? null,
    mfgDate: dateOnly(lot.mfgDate as string),
    expDate: dateOnly(lot.expDate as string),
    importDate: dateOnly(lot.receivedAt as string),
    poRef: po?.poNumber ?? null,
    docs: resolvedDocs,
  }
}
