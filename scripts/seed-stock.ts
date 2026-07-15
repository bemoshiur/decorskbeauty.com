import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const PO_NUMBER = 'DKB-SEED-STOCK-1'

const existing = await payload.find({
  collection: 'purchaseOrders',
  where: { poNumber: { equals: PO_NUMBER } },
  limit: 1,
  depth: 0,
})
if (existing.docs[0]) {
  console.log('stock PO already exists — skipping')
  process.exit(0)
}

const supFound = await payload.find({
  collection: 'suppliers',
  where: { name: { equals: 'Korea Beauty Imports' } },
  limit: 1,
})
const supplierId =
  supFound.docs[0]?.id ??
  (
    await payload.create({
      collection: 'suppliers',
      data: { name: 'Korea Beauty Imports', country: 'South Korea', defaultCurrency: 'KRW' },
    })
  ).id

const { docs: variants } = await payload.find({
  collection: 'variants',
  where: { active: { equals: true } },
  depth: 0,
  limit: 500,
})

const lines = variants
  .filter((v) => v.sku && !v.sku.startsWith('TEST'))
  .map((v) => ({
    variant: v.id,
    qty: 30,
    unitCostForeign: Math.round((v.mrp ?? 1000) * 4), // rough KRW cost
    lotCode: `${v.sku}-2506`,
    mfgDate: '2025-06-01',
    expDate: '2027-06-01', // well beyond the 3-month FEFO window
  }))

const po = await payload.create({
  collection: 'purchaseOrders',
  data: {
    poNumber: PO_NUMBER,
    supplier: supplierId,
    currency: 'KRW',
    fxRate: 0.085,
    allocationBasis: 'byValue',
    freightBDT: 8000,
    dutyBDT: 5000,
    vatAtImportBDT: 3000,
    clearingBDT: 2000,
    otherChargesBDT: 1000,
    status: 'draft',
    lines,
  },
})

await payload.update({ collection: 'purchaseOrders', id: po.id, data: { status: 'received' } })

const lots = await payload.count({ collection: 'stockLots' })
const moves = await payload.count({ collection: 'stockMovements' })
console.log(`received PO ${PO_NUMBER}: ${lines.length} lines → stockLots=${lots.totalDocs} movements=${moves.totalDocs}`)
process.exit(0)
