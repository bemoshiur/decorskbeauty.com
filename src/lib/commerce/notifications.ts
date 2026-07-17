import type { Order } from '@/payload-types'
import { getSmsProvider, normalizeMsisdn, segmentCount } from '@/lib/integrations/sms'

const tk = (n: number) => `Tk ${Math.round(n).toLocaleString('en-US')}`

/** Build the order-confirmation SMS body. GSM-7 only — NO ৳ (a single non-GSM char flips the whole
 *  message to 70-char unicode segments, tripling cost). Kept to one segment. */
export function orderConfirmationBody(order: Pick<Order, 'id' | 'orderNumber' | 'codAmount'>): string {
  const orderNo = order.orderNumber ?? `Order ${order.id}`
  const cod = order.codAmount ?? 0
  return cod > 0
    ? `${orderNo} confirmed at Decors K-Beauty. Cash on delivery ${tk(cod)}. Delivery 2-3 days in Dhaka. Help 01712-113032`
    : `${orderNo} confirmed & paid at Decors K-Beauty. Delivery 2-3 days in Dhaka. Help 01712-113032`
}

/**
 * Order-confirmation SMS — the BD post-purchase trust signal the result page promises. Best-effort:
 * never throws, never blocks order placement or the EPS callback. Sends via the configured provider
 * (GenNet in prod); no-ops to the console sink in dev.
 */
export async function sendOrderConfirmationSms(
  order: Pick<Order, 'id' | 'orderNumber' | 'phone' | 'shipping' | 'codAmount'>,
): Promise<void> {
  try {
    const phone = order.shipping?.phone || order.phone
    if (!phone) return
    const body = orderConfirmationBody(order)
    await getSmsProvider().send(normalizeMsisdn(phone), body)
  } catch {
    /* SMS is a best-effort trust signal — a send failure must never affect the order */
  }
}

/** Exposed for the build-time length check (keep the template within one GSM-7 segment). */
export { segmentCount }
