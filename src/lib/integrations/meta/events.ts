import { randomUUID } from 'crypto'

/** event_id is a STRING, byte-identical between Pixel and CAPI (§13.3). Server generates it. */
export const newEventId = (): string => randomUUID()

/** fbc from a landing fbclid (§13.6): fb.1.{unixMs}.{fbclid}. */
export const buildFbc = (fbclid: string, unixMs: number): string => `fb.1.${unixMs}.${fbclid}`

export type MetaContent = { id: string; quantity: number; item_price?: number }

export type CapiEventInput = {
  eventName: string
  eventTimeSec: number
  eventId: string
  eventSourceUrl?: string
  userData: Record<string, string>
  value?: number
  currency?: string
  contentIds?: string[] // === variants.sku (#1)
  contents?: MetaContent[]
}

export function buildCapiEvent(e: CapiEventInput) {
  const custom_data: Record<string, unknown> = {}
  if (e.value != null) custom_data.value = e.value
  if (e.currency) custom_data.currency = e.currency
  if (e.contentIds?.length) custom_data.content_ids = e.contentIds
  if (e.contents?.length) custom_data.contents = e.contents
  if (e.contentIds?.length || e.contents?.length) custom_data.content_type = 'product'

  return {
    event_name: e.eventName,
    event_time: e.eventTimeSec,
    event_id: e.eventId,
    action_source: 'website',
    ...(e.eventSourceUrl ? { event_source_url: e.eventSourceUrl } : {}),
    user_data: e.userData,
    ...(Object.keys(custom_data).length ? { custom_data } : {}),
  }
}
