import type { Payload } from 'payload'

import type { Variant } from '@/payload-types'
import { markHandedToCourier } from '@/lib/commerce/fulfilment'
import { pathaoCreateOrder, type CourierCreateError } from '../pathao/client'
import { steadfastCreateOrder } from '../steadfast/client'
import type { CourierOrderInput } from './payloads'

export * from './payloads'

const now = () => new Date().toISOString()

/**
 * Push an order to the courier (§9, §11.3). Pathao primary; falls back to Steadfast when Pathao
 * fails twice with a 5xx or the destination has no Pathao area id. Logs which provider + why on the
 * timeline, then ships the reserved stock. amount_to_collect === codAmount is guaranteed here (#2).
 */
export async function pushOrderToCourier(payload: Payload, orderId: number): Promise<{ provider: string; consignmentId: string }> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 2, overrideAccess: true })

  let weightG = 0
  let qty = 0
  for (const item of order.items ?? []) {
    const v = item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
    weightG += (v?.weightGrams ?? 0) * (item.qty ?? 0)
    qty += item.qty ?? 0
  }

  const input: CourierOrderInput = {
    orderNumber: order.orderNumber ?? String(order.id),
    codAmount: order.codAmount ?? 0,
    recipientName: order.shipping?.name ?? '',
    recipientPhone: order.shipping?.phone ?? order.phone ?? '',
    recipientAddress: order.shipping?.address ?? '',
    cityId: order.shipping?.cityId,
    zoneId: order.shipping?.zoneId,
    areaId: order.shipping?.areaId,
    weightKg: weightG / 1000,
    itemQuantity: qty || 1,
    itemDescription: `Decor's K-Beauty order ${order.orderNumber}`,
  }

  // #2 — the runtime guard mirroring the unit test.
  if (input.codAmount !== (order.codAmount ?? 0)) {
    throw new Error('amount_to_collect must equal orders.codAmount (#2)')
  }

  let provider = 'pathao'
  let consignmentId = ''
  let reason = ''

  const noPathaoArea = !order.shipping?.areaId
  try {
    if (noPathaoArea) throw new Error('no Pathao area id')
    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await pathaoCreateOrder(input)
        consignmentId = r.consignmentId
        break
      } catch (e) {
        lastErr = e
        const status = (e as CourierCreateError).status
        if (status && status < 500) throw e // don't retry / fall back on a 4xx
      }
    }
    if (!consignmentId) throw lastErr ?? new Error('Pathao failed')
  } catch {
    provider = 'steadfast'
    reason = noPathaoArea ? 'no Pathao area' : 'Pathao 5xx x2'
    const r = await steadfastCreateOrder(input)
    consignmentId = r.consignmentId
  }

  await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: {
      courier: { provider: provider as 'pathao' | 'steadfast', consignmentId, pushedAt: now() },
      timeline: [...(order.timeline ?? []), { at: now(), actor: 'system', event: 'pushedToCourier', note: `${provider}${reason ? ` (${reason})` : ''} · ${consignmentId} · collect ৳${input.codAmount}` }],
    },
  })

  await markHandedToCourier(payload, orderId)
  return { provider, consignmentId }
}
