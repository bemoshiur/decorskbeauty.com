import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Server-only Payload Local API handle. getPayload memoizes internally.
 * Only src/lib/** may call this — the storefront reads through src/lib/commerce/** (§3).
 */
export const getPayloadClient = () => getPayload({ config })
