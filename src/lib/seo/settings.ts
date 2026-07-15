import { unstable_cache } from 'next/cache'

import { getPayloadClient } from '@/lib/payload'
import type { ReturnPolicyConfig } from './shipping'

/** The configured return policy for Product JSON-LD (§14.2), cached with the catalog tag. Never
 *  fabricates a policy — reads what admin set in the settings global. */
export const getReturnPolicy = (): Promise<ReturnPolicyConfig> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        const s = await payload.findGlobal({ slug: 'settings', overrideAccess: true })
        return { returnsAccepted: s?.returns?.returnsAccepted ?? true, returnWindowDays: s?.returns?.returnWindowDays ?? 3 }
      } catch {
        return { returnsAccepted: true, returnWindowDays: 3 }
      }
    },
    ['seo-return-policy'],
    { tags: ['catalog'], revalidate: 3600 },
  )()
