import { getPayloadClient } from '@/lib/payload'
import { verifyResumeToken } from '@/lib/browser/resumeToken'

export type ResumeOrderView = { valid: boolean; orderNumber?: string; amount?: number; alreadyPaid?: boolean }

/** Safe projection for /checkout/pay/[token] — rehydrates order + txn from the token + DB (§13.5). */
export async function getResumeOrderView(token: string): Promise<ResumeOrderView> {
  const rt = verifyResumeToken(token)
  if (!rt?.orderId || !rt.mtxn) return { valid: false }
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id: rt.orderId, depth: 0, overrideAccess: true }).catch(() => null)
  const { docs } = await payload.find({
    collection: 'transactions',
    where: { merchantTransactionId: { equals: rt.mtxn } },
    limit: 1,
    overrideAccess: true,
  })
  const txn = docs[0]
  if (!order || !txn) return { valid: false }
  return { valid: true, orderNumber: order.orderNumber ?? undefined, amount: txn.amount ?? undefined, alreadyPaid: txn.status === 'success' }
}
