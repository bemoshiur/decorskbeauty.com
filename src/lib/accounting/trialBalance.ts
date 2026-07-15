import type { Payload, PayloadRequest } from 'payload'

import { round2 } from '@/lib/inventory/landedCost'

export type TrialBalanceRow = { code: string; name: string; type: string; debit: number; credit: number; balance: number }
export type TrialBalance = { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean; month?: string }

/**
 * Trial balance (§12.6): sum posted journal lines per account. The books are correct iff total
 * debits === total credits. Optionally scoped to a month (YYYY-MM). Reads posted entries only —
 * drafts and voids never affect the ledger.
 */
export async function computeTrialBalance(payload: Payload, opts: { month?: string; req?: PayloadRequest } = {}): Promise<TrialBalance> {
  const { month, req } = opts

  const entryWhere: Record<string, unknown> = { status: { equals: 'posted' } }
  if (month) {
    entryWhere.date = { greater_than_equal: `${month}-01T00:00:00.000Z`, less_than: nextMonth(month) }
  }
  const { docs: entries } = await payload.find({ collection: 'journalEntries', where: entryWhere as never, limit: 100000, depth: 0, overrideAccess: true, req })
  const entryIds = entries.map((e) => e.id)
  if (!entryIds.length) return { rows: [], totalDebit: 0, totalCredit: 0, balanced: true, month }

  const { docs: accounts } = await payload.find({ collection: 'accounts', limit: 1000, depth: 0, overrideAccess: true, req })
  const acctById = new Map(accounts.map((a) => [a.id, a]))
  const agg = new Map<number, { debit: number; credit: number }>()

  // Page through lines for the selected entries.
  let page = 1
  for (;;) {
    const { docs: lines, hasNextPage } = await payload.find({
      collection: 'journalLines',
      where: { entry: { in: entryIds } } as never,
      limit: 5000,
      page,
      depth: 0,
      overrideAccess: true,
      req,
    })
    for (const l of lines) {
      const acctId = typeof l.account === 'object' ? (l.account as { id?: number }).id : (l.account as number)
      if (acctId == null) continue
      const cur = agg.get(acctId) ?? { debit: 0, credit: 0 }
      cur.debit += l.debit ?? 0
      cur.credit += l.credit ?? 0
      agg.set(acctId, cur)
    }
    if (!hasNextPage) break
    page++
  }

  const rows: TrialBalanceRow[] = []
  let totalDebit = 0
  let totalCredit = 0
  for (const [acctId, { debit, credit }] of agg) {
    const a = acctById.get(acctId)
    if (!a) continue
    const d = round2(debit)
    const c = round2(credit)
    totalDebit += d
    totalCredit += c
    rows.push({ code: String(a.code), name: String(a.name), type: String(a.type), debit: d, credit: c, balance: round2(d - c) })
  }
  rows.sort((x, y) => x.code.localeCompare(y.code))
  totalDebit = round2(totalDebit)
  totalCredit = round2(totalCredit)
  return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.005, month }
}

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return `${ny}-${String(nm).padStart(2, '0')}-01T00:00:00.000Z`
}
