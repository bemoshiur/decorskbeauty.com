import type { Payload, PayloadRequest } from 'payload'

/**
 * Chart of accounts (§12.1). Seed once, add freely, NEVER renumber — the codes are referenced
 * by every posting rule in `postings.ts` and by historical journal lines. Renumbering is blocked
 * by a beforeChange guard on the `accounts` collection.
 */
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export const CHART: { code: string; name: string; type: AccountType }[] = [
  { code: '1010', name: 'Cash in hand', type: 'asset' },
  { code: '1020', name: 'Bank', type: 'asset' },
  { code: '1030', name: 'EPS receivable (captured, not settled)', type: 'asset' },
  { code: '1040', name: 'Courier COD receivable', type: 'asset' },
  { code: '1050', name: 'Inventory (at landed cost)', type: 'asset' },
  { code: '1060', name: 'Goods in transit', type: 'asset' },
  { code: '1070', name: 'Advance to supplier', type: 'asset' },
  { code: '1080', name: 'VAT input / rebate', type: 'asset' },
  { code: '2010', name: 'Accounts payable, suppliers', type: 'liability' },
  { code: '2020', name: 'VAT payable (output)', type: 'liability' },
  { code: '2030', name: 'Customer advances (pre-order)', type: 'liability' },
  { code: '2040', name: 'AIT / TDS payable', type: 'liability' },
  { code: '3010', name: 'Owner capital', type: 'equity' },
  { code: '3020', name: 'Retained earnings', type: 'equity' },
  { code: '4010', name: 'Product sales', type: 'income' },
  { code: '4020', name: 'Delivery income', type: 'income' },
  { code: '4030', name: 'Discounts and promotions (contra)', type: 'income' },
  { code: '4040', name: 'Returns and refunds (contra)', type: 'income' },
  { code: '5010', name: 'COGS, product', type: 'expense' },
  { code: '5020', name: 'Inventory write-off (expiry/damage)', type: 'expense' },
  { code: '6010', name: 'Courier fees', type: 'expense' },
  { code: '6020', name: 'Payment gateway MDR', type: 'expense' },
  { code: '6030', name: 'SMS', type: 'expense' },
  { code: '6040', name: 'Ad spend', type: 'expense' },
  { code: '6050', name: 'Rent', type: 'expense' },
  { code: '6060', name: 'Salaries', type: 'expense' },
  { code: '6070', name: 'Packaging', type: 'expense' },
  { code: '6080', name: 'Miscellaneous', type: 'expense' },
]

/** The account codes referenced by the posting rules — a compile-time guard against typos. */
export const ACCT = {
  cash: '1010',
  bank: '1020',
  epsReceivable: '1030',
  codReceivable: '1040',
  inventory: '1050',
  vatInput: '1080',
  apSuppliers: '2010',
  vatPayable: '2020',
  customerAdvances: '2030',
  productSales: '4010',
  deliveryIncome: '4020',
  discounts: '4030',
  returns: '4040',
  cogs: '5010',
  writeOff: '5020',
  courierFees: '6010',
  mdr: '6020',
  adSpend: '6040',
} as const

/**
 * Idempotent chart seed — creates any missing account, leaves existing ones untouched (never
 * renumbers). Used by `scripts/seed-accounts.ts` and the integration tests; the production path
 * seeds via migration (§12.1). Safe to run repeatedly.
 */
export async function ensureAccounts(payload: Payload, req?: PayloadRequest): Promise<void> {
  const { docs } = await payload.find({ collection: 'accounts', limit: 1000, depth: 0, overrideAccess: true, req })
  const have = new Set(docs.map((a) => a.code))
  for (const a of CHART) {
    if (have.has(a.code)) continue
    await payload.create({ collection: 'accounts', overrideAccess: true, req, data: { code: a.code, name: a.name, type: a.type, active: true } })
  }
}

/**
 * Resolve account codes → Payload IDs for a set of codes, ensuring the chart exists first.
 * Returns a Map keyed by code. Throws if a referenced code is missing after ensure (a coding bug).
 */
export async function resolveAccountIds(payload: Payload, codes: string[], req?: PayloadRequest): Promise<Map<string, number>> {
  const wanted = [...new Set(codes)]
  const { docs } = await payload.find({ collection: 'accounts', where: { code: { in: wanted } }, limit: 1000, depth: 0, overrideAccess: true, req })
  const map = new Map<string, number>(docs.map((a) => [String(a.code), a.id as number]))
  const missing = wanted.filter((c) => !map.has(c))
  if (missing.length) {
    // Chart not seeded (or a bad code). Seed then retry once.
    await ensureAccounts(payload, req)
    const { docs: again } = await payload.find({ collection: 'accounts', where: { code: { in: missing } }, limit: 1000, depth: 0, overrideAccess: true, req })
    for (const a of again) map.set(String(a.code), a.id as number)
  }
  const stillMissing = wanted.filter((c) => !map.has(c))
  if (stillMissing.length) throw new Error(`Unknown account code(s): ${stillMissing.join(', ')} — not in the chart of accounts (§12.1).`)
  return map
}
