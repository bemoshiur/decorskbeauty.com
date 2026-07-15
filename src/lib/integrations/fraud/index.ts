/**
 * Courier fraud / success-rate check (§7.1, §9.3). A SOFT dependency: 2.5s timeout, then `review`.
 * Never throws, never blocks a sale on an API outage. Pathao's phone success-rate is the real source;
 * Steadfast has no clean public API (don't scrape the panel).
 */
export type FraudDecision = 'pass' | 'review' | 'block'

export type FraudResult = {
  decision: FraudDecision
  provider: string
  successRatio: number | null
  totalParcels?: number
  delivered?: number
  cancelled?: number
  raw?: unknown
}

export interface FraudProvider {
  name: string
  /** null successRatio = no history. */
  check(phone: string): Promise<{ successRatio: number | null; totalParcels?: number; delivered?: number; cancelled?: number; raw?: unknown }>
}

/** §7.1 decision policy. Prepaid orders carry no RTO risk → always pass. */
export function decideFraud(input: { successRatio: number | null; blacklisted: boolean; isCod: boolean }): FraudDecision {
  if (!input.isCod) return 'pass'
  if (input.blacklisted) return 'block'
  const r = input.successRatio
  if (r == null) return 'pass' // no history
  if (r >= 0.8) return 'pass'
  if (r >= 0.5) return 'review'
  return 'block'
}

const TIMEOUT_MS = 2500

function getProvider(): FraudProvider | null {
  const which = process.env.FRAUD_PROVIDER || 'null'
  if (which === 'pathao') {
    return {
      name: 'pathao',
      async check(phone) {
        const { pathaoSuccessRate } = await import('@/lib/integrations/pathao/client')
        const r = await pathaoSuccessRate(phone)
        return { successRatio: r.successRatio, raw: r.raw }
      },
    }
  }
  if (which === 'fraudbd' && process.env.FRAUDBD_API_KEY) {
    return {
      name: 'fraudbd',
      async check(phone) {
        const res = await fetch('https://api.fraudbd.com/v1/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FRAUDBD_API_KEY}` },
          body: JSON.stringify({ phone }),
        })
        const j = (await res.json().catch(() => ({}))) as { success_ratio?: number; total?: number; delivered?: number; cancelled?: number }
        return { successRatio: typeof j.success_ratio === 'number' ? j.success_ratio : null, totalParcels: j.total, delivered: j.delivered, cancelled: j.cancelled, raw: j }
      },
    }
  }
  return null
}

/** Run the check with the soft-dependency guarantee. */
export async function checkFraud(phone: string, ctx: { isCod: boolean; blacklisted: boolean }): Promise<FraudResult> {
  if (ctx.blacklisted && ctx.isCod) return { decision: 'block', provider: 'blacklist', successRatio: null }

  const provider = getProvider()
  if (!provider) return { decision: ctx.isCod ? 'review' : 'pass', provider: 'null', successRatio: null }

  try {
    const result = await Promise.race([
      provider.check(phone),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('fraud timeout')), TIMEOUT_MS)),
    ])
    return {
      decision: decideFraud({ successRatio: result.successRatio, blacklisted: ctx.blacklisted, isCod: ctx.isCod }),
      provider: provider.name,
      successRatio: result.successRatio,
      totalParcels: result.totalParcels,
      delivered: result.delivered,
      cancelled: result.cancelled,
      raw: result.raw,
    }
  } catch {
    return { decision: ctx.isCod ? 'review' : 'pass', provider: provider.name, successRatio: null } // soft: never block on outage
  }
}
