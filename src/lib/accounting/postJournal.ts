import type { Payload, PayloadRequest } from 'payload'

import { round2 } from '@/lib/inventory/landedCost'
import type { JournalEntry } from '@/payload-types'
import { resolveAccountIds } from './accounts'
import type { PostingLine } from './postings'

export type JournalSource = 'order' | 'purchaseOrder' | 'courierPayout' | 'epsSettlement' | 'manual' | 'systemClose'

export type PostJournalInput = {
  date?: string // ISO; defaults to now
  source: JournalSource
  sourceId: string
  ref: string // stable per (source,sourceId) — the idempotency + audit key, e.g. 'sale', 'cogs', 'po-receive'
  memo?: string
  lines: PostingLine[]
  postedBy?: number
}

const TOLERANCE = 0.005 // half a cent

/**
 * Pure balance check (§4.4 / #5): debits === credits to 2dp AND every line has exactly one of
 * debit/credit non-zero. Returns an error string, or null if the entry is valid. A journal that
 * fails this must never reach the database.
 */
export function validateBalance(lines: Pick<PostingLine, 'debit' | 'credit'>[]): string | null {
  if (!lines.length) return 'Journal has no lines.'
  let debit = 0
  let credit = 0
  for (const l of lines) {
    const d = round2(l.debit ?? 0)
    const c = round2(l.credit ?? 0)
    if (d < 0 || c < 0) return 'Journal line has a negative amount.'
    if (d !== 0 && c !== 0) return 'Journal line has both a debit and a credit — exactly one must be non-zero.'
    if (d === 0 && c === 0) return 'Journal line has neither a debit nor a credit.'
    debit += d
    credit += c
  }
  if (Math.abs(round2(debit) - round2(credit)) > TOLERANCE) return `Journal does not balance: debit ${round2(debit)} ≠ credit ${round2(credit)}.`
  return null
}

const monthOf = (iso: string): string => iso.slice(0, 7) // YYYY-MM

/** Ensure a fiscalPeriod row for a month; returns it. Rejects if it exists and is closed (§12.6). */
async function periodFor(payload: Payload, month: string, req?: PayloadRequest): Promise<{ id: number; status: string }> {
  const { docs } = await payload.find({ collection: 'fiscalPeriods', where: { month: { equals: month } }, limit: 1, depth: 0, overrideAccess: true, req })
  if (docs[0]) return { id: docs[0].id as number, status: docs[0].status as string }
  const created = await payload.create({ collection: 'fiscalPeriods', overrideAccess: true, req, data: { month, status: 'open' } })
  return { id: created.id as number, status: 'open' }
}

/**
 * The journal writer — the ONE path that posts a balanced double-entry (§12.3, #5). Validates
 * balance up front (before any write), is idempotent on (source, sourceId, ref) so a re-fired event
 * never double-posts, and rejects postings to a closed period (§12.6). Threads `req` so it joins the
 * caller's transaction (e.g. the PO-receive hook). Returns the posted entry, or the existing one.
 */
export async function postJournal(payload: Payload, input: PostJournalInput, req?: PayloadRequest): Promise<JournalEntry | null> {
  const err = validateBalance(input.lines)
  if (err) throw new Error(`[accounting] ${err} (${input.source}:${input.sourceId}/${input.ref})`)

  // Idempotency: one posted entry per (source, sourceId, ref).
  const existing = await payload.find({
    collection: 'journalEntries',
    where: { and: [{ source: { equals: input.source } }, { sourceId: { equals: input.sourceId } }, { ref: { equals: input.ref } }, { status: { not_equals: 'void' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (existing.docs[0]) return existing.docs[0] as JournalEntry

  const date = input.date ?? new Date().toISOString()
  const month = monthOf(date)
  const period = await periodFor(payload, month, req)
  if (period.status === 'closed') throw new Error(`[accounting] period ${month} is closed — cannot post ${input.source}:${input.sourceId}/${input.ref} (§12.6).`)

  const accountIds = await resolveAccountIds(payload, input.lines.map((l) => l.account), req)

  // Create the entry as draft, attach the lines, then flip to posted. The balance hook fires on the
  // posted transition (when the lines exist) as defense-in-depth over this writer's own check.
  // If a concurrent writer already inserted this (source,sourceId,ref), the unique index rejects this
  // INSERT — re-find and return the winner's entry instead of double-posting.
  let entry
  try {
    entry = await payload.create({
      collection: 'journalEntries',
      overrideAccess: true,
      req,
      data: { date, source: input.source, sourceId: input.sourceId, ref: input.ref, memo: input.memo, status: 'draft', period: period.id },
    })
  } catch (e) {
    const raced = await payload.find({
      collection: 'journalEntries',
      where: { and: [{ source: { equals: input.source } }, { sourceId: { equals: input.sourceId } }, { ref: { equals: input.ref } }, { status: { not_equals: 'void' } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (raced.docs[0]) return raced.docs[0] as JournalEntry
    throw e // not the idempotency race — a real failure
  }

  for (const l of input.lines) {
    await payload.create({
      collection: 'journalLines',
      overrideAccess: true,
      req,
      data: { entry: entry.id, account: accountIds.get(l.account)!, debit: round2(l.debit), credit: round2(l.credit), orderRef: l.orderRef, poRef: l.poRef },
    })
  }

  const posted = await payload.update({
    collection: 'journalEntries',
    id: entry.id,
    overrideAccess: true,
    req,
    data: { status: 'posted', postedAt: new Date().toISOString(), postedBy: input.postedBy },
  })
  return posted as JournalEntry
}
