import type { Order, Product, Variant } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { allocateFefo, type AllocatableLot, type LotStatus } from '@/lib/inventory/allocate'
import { generateMerchantTransactionId } from '@/lib/integrations/eps/client'
import { computeCheckoutTerms, type Zone } from './checkout'
import { effectivePrice } from './products'
import { cancelStaleOrders } from './stock'
import { enqueuePurchase } from './tracking'

export type PlaceOrderInput = {
  lines: { variantId: number; qty: number }[]
  zone: Zone
  customer: { name: string; phone: string; email?: string; address: string; landmark?: string }
  /** 'cod' = pay any advance online + remainder on delivery; 'prepay' = pay the full total online. */
  paymentChoice: 'cod' | 'prepay'
  channel?: Order['channel']
  attribution?: Record<string, unknown>
  ipAddress?: string
  inAppBrowser?: boolean
}

export type PlaceOrderResult = {
  order: Order
  payment: { required: boolean; amount: number; purpose: 'advance' | 'full'; merchantTransactionId?: string }
}

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

/**
 * Create an order at confirmation (§7, §10.1): compute terms, snapshot prices/costs, FEFO-reserve
 * ready-stock lines via `reserve` movements (the only writer of availableQty, #2/#4), then either
 * confirm (COD) or stage an EPS transaction. Payment is verified in the EPS callback (#7).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const payload = await getPayloadClient()

  // 1. Load variants + products.
  const variantIds = input.lines.map((l) => l.variantId)
  const { docs: variantDocs } = await payload.find({
    collection: 'variants',
    where: { id: { in: variantIds } },
    depth: 1,
    limit: 500,
    overrideAccess: true,
  })
  const variantById = new Map(variantDocs.map((v) => [v.id, v as Variant]))

  const termLines = input.lines.map((l) => {
    const v = variantById.get(l.variantId)
    const p = v?.product && typeof v.product === 'object' ? (v.product as Product) : null
    return {
      variant: v,
      product: p,
      qty: l.qty,
      unitPrice: v ? effectivePrice(v) : 0,
      isPreOrder: p?.fulfilmentMode === 'preOrder',
    }
  })

  // 2. Terms — the single source of the numbers (#3).
  const terms = computeCheckoutTerms(
    { lines: termLines.map((t) => ({ unitPrice: t.unitPrice, qty: t.qty, isPreOrder: t.isPreOrder })) },
    input.zone,
  )

  // 3. Payment method.
  const hasPreOrder = termLines.some((t) => t.isPreOrder)
  const paymentMethod: NonNullable<Order['paymentMethod']> = hasPreOrder
    ? 'epsFull'
    : input.paymentChoice === 'prepay'
      ? 'epsFull'
      : terms.advanceRequired > 0
        ? 'epsAdvance'
        : 'cod'
  const orderType: NonNullable<Order['orderType']> = hasPreOrder
    ? termLines.every((t) => t.isPreOrder)
      ? 'preorder'
      : 'mixed'
    : 'ready'

  // 4. Customer by phone (identity spine).
  const existing = await payload.find({ collection: 'customers', where: { phone: { equals: input.customer.phone } }, limit: 1, overrideAccess: true })
  const customer =
    existing.docs[0] ??
    (await payload.create({
      collection: 'customers',
      overrideAccess: true,
      data: { phone: input.customer.phone, name: input.customer.name, email: input.customer.email },
    }))

  // Opportunistic reservation sweep (bounded): free stock held by orders abandoned >60min ago
  // BEFORE we allocate, so a once-daily release-stale cron (Vercel Hobby limit) can't let held
  // reservations starve real buyers. Best-effort — never blocks the sale.
  try {
    await cancelStaleOrders(payload, new Date(Date.now() - 60 * 60_000).toISOString(), 25)
  } catch {
    /* sweeping is a best-effort optimization, not a precondition for placing an order */
  }

  // 5. FEFO allocation for ready-stock lines (pre-order lines hold no stock).
  const now = Date.now()
  const items: NonNullable<Order['items']> = []
  const reservations: { lotId: number; variantId: number; qty: number }[] = []

  for (const t of termLines) {
    if (!t.variant) continue
    let lotAllocations: NonNullable<NonNullable<Order['items']>[number]['lotAllocations']> = []

    if (!t.isPreOrder) {
      const { docs: lotDocs } = await payload.find({
        collection: 'stockLots',
        where: { variant: { equals: t.variant.id } },
        depth: 0,
        limit: 500,
        overrideAccess: true,
      })
      const lots: AllocatableLot[] = lotDocs.map((l) => ({
        id: l.id,
        expDate: (l.expDate as string) ?? '',
        receivedAt: (l.receivedAt as string) ?? '',
        qtyAvailable: l.qtyAvailable ?? 0,
        landedCostPerUnit: l.landedCostPerUnit ?? 0,
        status: (l.status ?? 'open') as LotStatus,
      }))
      const { allocations, shortfall } = allocateFefo(lots, t.qty, now)
      if (shortfall > 0) {
        throw new Error(`Out of stock: ${t.product?.title ?? t.variant.sku} (short ${shortfall})`)
      }
      lotAllocations = allocations.map((a) => ({
        lot: Number(a.lotId),
        qty: a.qty,
        landedCostSnapshot: a.landedCostPerUnit,
      }))
      for (const a of allocations) reservations.push({ lotId: Number(a.lotId), variantId: t.variant.id, qty: a.qty })
    }

    items.push({
      variant: t.variant.id,
      titleSnapshot: t.product?.title ?? t.variant.sku,
      skuSnapshot: t.variant.sku,
      unitPriceSnapshot: t.unitPrice,
      qty: t.qty,
      lineTotal: t.unitPrice * t.qty,
      fulfilmentMode: t.product?.fulfilmentMode ?? 'readyStock',
      lotAllocations,
    })
  }

  // 6. Create the order.
  const isCod = paymentMethod === 'cod'
  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      channel: input.channel ?? 'web',
      customer: customer.id,
      phone: input.customer.phone,
      email: input.customer.email,
      items,
      orderType,
      subtotal: terms.subtotal,
      deliveryCharge: terms.deliveryCharge,
      grandTotal: terms.grandTotal,
      advanceRequired: terms.advanceRequired,
      advancePaid: 0,
      // What the courier collects — NEVER grandTotal (#2). A full online prepay (epsFull) leaves
      // nothing to collect on delivery, so codAmount is 0; otherwise it's grandTotal − advance.
      codAmount: paymentMethod === 'epsFull' ? 0 : terms.codAmount,
      paymentMethod,
      paymentStatus: 'unpaid',
      fulfilmentStatus: isCod ? 'confirmed' : 'pending',
      zone: input.zone,
      shipping: { name: input.customer.name, phone: input.customer.phone, address: input.customer.address, landmark: input.customer.landmark },
      attribution: input.attribution ?? undefined,
      riskFlags: input.inAppBrowser ? ['inAppBrowser'] : undefined,
      timeline: [{ at: new Date().toISOString(), actor: 'system', event: 'placed', note: paymentMethod }],
    } as Partial<Order>,
  })

  // 7. Reserve stock through movements (drops availableQty via the movement hook, #4).
  for (const r of reservations) {
    await payload.create({
      collection: 'stockMovements',
      overrideAccess: true,
      data: { lot: r.lotId, variant: r.variantId, qty: -r.qty, type: 'reserve', refType: 'order', refId: String(order.id), at: new Date().toISOString() },
    })
  }

  // 8. Payment: COD needs none; EPS stages a pending transaction (verified in the callback).
  if (isCod) {
    // COD confirms at placement (after OTP) → Purchase fires here (#9, §13.4).
    await enqueuePurchase(payload, order.id)
    return { order, payment: { required: false, amount: 0, purpose: 'full' } }
  }
  const purpose: 'advance' | 'full' = paymentMethod === 'epsAdvance' ? 'advance' : 'full'
  const amount = purpose === 'advance' ? terms.advanceRequired : terms.grandTotal
  const merchantTransactionId = generateMerchantTransactionId()
  await payload.create({
    collection: 'transactions',
    overrideAccess: true,
    data: { order: order.id, merchantTransactionId, amount, purpose, status: 'pending' },
  })

  return { order, payment: { required: true, amount, purpose, merchantTransactionId } }
}
