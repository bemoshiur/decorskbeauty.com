import type { CollectionBeforeChangeHook } from 'payload'

import { validateBalance } from '@/lib/accounting/postJournal'

/**
 * §4.4 / #5 — a journal that does not balance must never reach the database. Enforced on the
 * draft → posted transition (when the separate journalLines exist): sum(debit) === sum(credit) to
 * 2dp and every line has exactly one side. Also blocks posting into a closed fiscal period (§12.6).
 * This is defense-in-depth behind the writer (`postJournal`), and the guard for manual admin entries.
 */
export const enforceJournalBalance: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const nextStatus = data.status ?? originalDoc?.status
  if (nextStatus !== 'posted') return data // draft/void never need to balance

  // An entry can only reach 'posted' by updating an existing draft that already has its lines.
  if (operation === 'create') {
    throw new Error('Create the journal as a draft, add its lines, then post it — a balanced entry cannot be created in one write.')
  }
  const payload = req.payload
  const entryId = originalDoc?.id
  if (!entryId) throw new Error('Cannot post a journal entry without an id.')

  const { docs: lines } = await payload.find({
    collection: 'journalLines',
    where: { entry: { equals: entryId } },
    limit: 10000,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const err = validateBalance(lines.map((l) => ({ debit: l.debit ?? 0, credit: l.credit ?? 0 })))
  if (err) throw new Error(`[accounting] ${err}`)

  // Closed-period guard (§12.6): resolve the period from the entry date, reject if closed.
  const date = (data.date ?? originalDoc?.date) as string | undefined
  if (date) {
    const month = date.slice(0, 7)
    const { docs: periods } = await payload.find({ collection: 'fiscalPeriods', where: { month: { equals: month } }, limit: 1, depth: 0, overrideAccess: true, req })
    if (periods[0]?.status === 'closed') throw new Error(`[accounting] period ${month} is closed — posting rejected (§12.6).`)
  }

  return data
}
