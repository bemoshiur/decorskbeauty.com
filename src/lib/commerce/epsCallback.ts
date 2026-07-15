import { NextResponse, type NextRequest } from 'next/server'
import type { Payload } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { verifyPayment, normalizeStatus } from '@/lib/integrations/eps/client'
import { postJournal, postAdvanceReceived } from '@/lib/accounting'
import { enqueuePurchase } from './tracking'

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

const site = (req: NextRequest) => process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
const result = (req: NextRequest, status: string, order?: string) =>
  NextResponse.redirect(new URL(`/checkout/result?status=${status}${order ? `&order=${encodeURIComponent(order)}` : ''}`, site(req)))

/** Return reserved units to available (release movements), once. */
async function releaseReservations(payload: Payload, orderId: number) {
  const already = await payload.find({
    collection: 'stockMovements',
    where: { refType: { equals: 'order' }, refId: { equals: String(orderId) }, type: { equals: 'release' } },
    limit: 1,
    overrideAccess: true,
  })
  if (already.docs.length) return // idempotent
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  for (const item of order.items ?? []) {
    for (const alloc of item.lotAllocations ?? []) {
      const lotId = relId(alloc.lot)
      const variantId = relId(item.variant)
      if (lotId && variantId && alloc.qty) {
        await payload.create({
          collection: 'stockMovements',
          overrideAccess: true,
          data: { lot: lotId, variant: variantId, qty: alloc.qty, type: 'release', refType: 'order', refId: String(orderId), at: new Date().toISOString() },
        })
      }
    }
  }
}

/**
 * Shared success/fail/cancel handler (§8.1, §8.3, #7). ALWAYS verifies via API No.3 — never the
 * redirect query params — and is idempotent under repeated reloads (keyed on the transaction).
 */
export async function handleEpsCallback(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mtxn = params.get('merchantTransactionId') ?? params.get('MerchantTransactionId')
  if (!mtxn) return result(req, 'error')

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { merchantTransactionId: { equals: mtxn } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const txn = docs[0]
  if (!txn) return result(req, 'error')
  const orderId = relId(txn.order)
  const order = orderId ? await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true }) : null

  // Idempotency: already finalized — don't re-verify/re-post (§8.3).
  if (txn.status === 'success') return result(req, 'success', order?.orderNumber ?? undefined)
  if (txn.status === 'failed' || txn.status === 'cancelled') return result(req, txn.status, order?.orderNumber ?? undefined)

  let verified: Awaited<ReturnType<typeof verifyPayment>>
  try {
    verified = await verifyPayment({ merchantTransactionId: mtxn }) // API No.3 — mandatory (#7)
  } catch (err) {
    console.error('[EPS] verify failed', mtxn, err instanceof Error ? err.message : err)
    return result(req, 'confirming', order?.orderNumber ?? undefined) // never mark paid on uncertainty
  }
  const status = normalizeStatus(verified)

  if (status === 'SUCCESS') {
    const paid = Number(verified.TotalAmount)
    if (Number.isFinite(paid) && txn.amount != null && Math.round(paid) !== Math.round(txn.amount)) {
      await payload.update({ collection: 'transactions', id: txn.id, data: { status: 'unknown', rawVerify: verified }, overrideAccess: true })
      console.error('[EPS] AMOUNT MISMATCH', mtxn)
      return result(req, 'error', order?.orderNumber ?? undefined)
    }
    // Money in before goods reach the customer is a LIABILITY (2030), not revenue (#5/#6, §12.3).
    // Post it BEFORE marking the txn success / setting advancePaid: the txn-success guard above
    // suppresses retries, so if this failed after that write the advance would never reach 2030 (a #6
    // hole) while the later delivery still debits 2030 by advancePaid → negative liability. Post first,
    // idempotent per transaction; a failed post leaves the txn 'pending' so a reload re-posts.
    if (orderId && txn.amount && txn.amount > 0) {
      await postJournal(payload, {
        source: 'order',
        sourceId: String(orderId),
        ref: `advance-${txn.merchantTransactionId}`,
        memo: `EPS ${txn.purpose} ৳${txn.amount} received — order ${order?.orderNumber ?? orderId}`,
        lines: postAdvanceReceived({ amount: txn.amount, orderRef: order?.orderNumber ?? String(orderId) }),
      })
    }
    await payload.update({
      collection: 'transactions',
      id: txn.id,
      data: { status: 'success', epsTransactionId: verified.EpsTransactionId, financialEntity: verified.FinancialEntity, verifiedAt: new Date().toISOString(), rawVerify: verified },
      overrideAccess: true,
    })
    if (orderId && order && order.paymentStatus !== 'paid') {
      await payload.update({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
        data: {
          advancePaid: txn.amount ?? 0,
          paymentStatus: txn.purpose === 'full' ? 'paid' : 'advancePaid',
          fulfilmentStatus: 'confirmed',
          timeline: [...(order.timeline ?? []), { at: new Date().toISOString(), actor: 'eps', event: 'paymentVerified', note: `${txn.purpose} ৳${txn.amount}` }],
        },
      })
    }
    // Purchase fires at confirmation (#9, §13.4).
    if (orderId) await enqueuePurchase(payload, orderId)
    return result(req, 'success', order?.orderNumber ?? undefined)
  }

  if (status === 'FAILED' || status === 'CANCELLED') {
    await payload.update({ collection: 'transactions', id: txn.id, data: { status: status === 'FAILED' ? 'failed' : 'cancelled', rawVerify: verified }, overrideAccess: true })
    if (orderId) {
      await releaseReservations(payload, orderId)
      await payload.update({ collection: 'orders', id: orderId, data: { fulfilmentStatus: 'cancelled' }, overrideAccess: true })
    }
    return result(req, status.toLowerCase(), order?.orderNumber ?? undefined)
  }

  return result(req, 'confirming', order?.orderNumber ?? undefined)
}
