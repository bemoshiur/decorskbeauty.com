import { round2 } from '@/lib/inventory/landedCost'
import { ACCT } from './accounts'

/**
 * Posting rules (§12.3). One pure function per financial event, each returning a balanced set of
 * `PostingLine[]` (debits === credits to 2dp, every line exactly one side). The journal writer
 * (`postJournal`) validates and persists. Every function here has a unit test asserting balance
 * and that it hits the right accounts (§12.3). No numbers are invented — callers pass real values.
 *
 * Revenue recognition is at DELIVERED (owner's call, [[revenue-recognition-delivered]]): the sale
 * and COGS entries fire from markDelivered, not ship. An in-transit RTO recognized nothing, so it
 * reverses nothing; a post-delivery customer return reverses the sale.
 */
export type PostingLine = { account: string; debit: number; credit: number; orderRef?: string; poRef?: string }

const dr = (account: string, amount: number, ref?: { orderRef?: string; poRef?: string }): PostingLine => ({ account, debit: round2(amount), credit: 0, ...ref })
const cr = (account: string, amount: number, ref?: { orderRef?: string; poRef?: string }): PostingLine => ({ account, debit: 0, credit: round2(amount), ...ref })

/** Drop zero-amount lines so callers can pass optional legs (discount, vat, advance) unconditionally. */
const nz = (lines: PostingLine[]): PostingLine[] => lines.filter((l) => round2(l.debit) !== 0 || round2(l.credit) !== 0)

// ── Inbound: purchase order received into stock ─────────────────────────────
/**
 * PO received (§12.3 row 1). Capitalize inventory at full landed cost (goods + all import
 * overheads, matching the landedCostPerUnit that lands on the lots so the GL ties to the inventory
 * sub-ledger) against accounts payable. Overhead breakdown lives in the entry memo.
 */
export function postPoReceived(args: { landedTotal: number; poRef?: string }): PostingLine[] {
  const total = round2(args.landedTotal)
  const ref = { poRef: args.poRef }
  return [dr(ACCT.inventory, total, ref), cr(ACCT.apSuppliers, total, ref)]
}

// ── Money in before goods move: advance / prepayment (EPS verified) ──────────
/**
 * Advance or full prepayment received via EPS (§12.3 rows 2–3, #6). ALL money taken before the
 * goods reach the customer is a liability (2030), never revenue — released to 4010 only at delivery.
 */
export function postAdvanceReceived(args: { amount: number; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([dr(ACCT.epsReceivable, args.amount, ref), cr(ACCT.customerAdvances, args.amount, ref)])
}

// ── Recognition at delivery: the sale ───────────────────────────────────────
/**
 * Sale recognized at delivery (§12.3 rows 4 & 6 combined; owner's delivery-time choice). Releases
 * any advance from 2030, books the remaining collectable as COD receivable, recognizes net product
 * + delivery income and output VAT, and passes discount through the 4030 contra.
 *
 * `subtotal` is the order's NET-of-discount product total (computeCheckoutTerms stores
 * subtotal = gross − discount, grandTotal = subtotal + delivery). Product sales (4010) are booked at
 * GROSS (subtotal + discount) so the 4030 discount contra reduces them back to net — otherwise the
 * discount would be counted twice and the entry would not balance. VAT is carved OUT of that gross
 * line (inclusive) so the entry stays balanced against an unchanged grandTotal when a rate is
 * configured (§12.4); today the rate is 0.
 *
 * Invariant: advanceApplied + codReceivable + discount === (subtotal + discount − vat) + delivery + vat
 *   ⇔ (advanceApplied + codReceivable = grandTotal = subtotal + delivery). Balances for every discount/vat.
 */
export function postSaleRevenue(args: {
  subtotal: number
  deliveryCharge: number
  vat?: number
  discount?: number
  advanceApplied?: number
  codReceivable?: number
  orderRef?: string
}): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  const vat = round2(args.vat ?? 0)
  const discount = round2(args.discount ?? 0)
  const advanceApplied = round2(args.advanceApplied ?? 0)
  const codReceivable = round2(args.codReceivable ?? 0)
  const grossProduct = round2(args.subtotal + discount - vat) // gross of discount, VAT carved out
  return nz([
    dr(ACCT.customerAdvances, advanceApplied, ref), // release the pre-paid liability
    dr(ACCT.codReceivable, codReceivable, ref), // what the courier still collects
    dr(ACCT.discounts, discount, ref), // contra-income (debit) — reduces gross 4010 back to net
    cr(ACCT.productSales, grossProduct, ref),
    cr(ACCT.deliveryIncome, args.deliveryCharge, ref),
    cr(ACCT.vatPayable, vat, ref),
  ])
}

/** Cost side of the sale (§12.3 row 5): relieve inventory at snapshot landed cost into COGS. */
export function postSaleCogs(args: { cogs: number; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([dr(ACCT.cogs, args.cogs, ref), cr(ACCT.inventory, args.cogs, ref)])
}

// ── Reversals ───────────────────────────────────────────────────────────────
/**
 * Customer return, refunded (§12.3 row 11) — a delivered order sent back. Reverses the recognized
 * sale through the 4040 contra, refunds the customer from bank, restocks inventory and reverses COGS.
 *
 * Invariant: returnsAmount === bankRefund (both = the reversed sale value); cogs nets to zero.
 */
export function postCustomerReturnRefund(args: { returnsAmount: number; bankRefund: number; cogs: number; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([
    dr(ACCT.returns, args.returnsAmount, ref), // contra-income (reverses 4010/4020)
    dr(ACCT.inventory, args.cogs, ref), // restock at original landed cost (#12)
    cr(ACCT.bank, args.bankRefund, ref),
    cr(ACCT.cogs, args.cogs, ref),
  ])
}

// ── Reconciliation (statements) ─────────────────────────────────────────────
/** Courier remits COD (§12.3 row 7): bank + courier fee clear the COD receivable. */
export function postCourierRemitsCod(args: { bank: number; courierFee: number; codReceivable: number; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([dr(ACCT.bank, args.bank, ref), dr(ACCT.courierFees, args.courierFee, ref), cr(ACCT.codReceivable, args.codReceivable, ref)])
}

/** EPS settles (§12.3 row 8): bank + MDR clear the EPS receivable. */
export function postEpsSettles(args: { bank: number; mdr: number; gross: number; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([dr(ACCT.bank, args.bank, ref), dr(ACCT.mdr, args.mdr, ref), cr(ACCT.epsReceivable, args.gross, ref)])
}

/** RTO courier charge (§12.3 row 10): the return fee is a courier expense, netted from the COD receivable or paid from bank. */
export function postRtoCourierCharge(args: { fee: number; creditAccount?: string; orderRef?: string }): PostingLine[] {
  const ref = { orderRef: args.orderRef }
  return nz([dr(ACCT.courierFees, args.fee, ref), cr(args.creditAccount ?? ACCT.codReceivable, args.fee, ref)])
}

// ── Adjustments ─────────────────────────────────────────────────────────────
/** Expiry / damage write-off (§12.3 row 12): relieve inventory into the write-off expense. */
export function postWriteOff(args: { amount: number }): PostingLine[] {
  return nz([dr(ACCT.writeOff, args.amount), cr(ACCT.inventory, args.amount)])
}

/** Ad spend (§12.3 row 13). */
export function postAdSpend(args: { amount: number; paidFrom?: string }): PostingLine[] {
  return nz([dr(ACCT.adSpend, args.amount), cr(args.paidFrom ?? ACCT.bank, args.amount)])
}
