import type { CollectionConfig } from 'payload'

/** Queued CAPI events (§13.3) — drained + retried by a 1-min cron with backoff. Staff-only. */
export const CapiQueue: CollectionConfig = {
  slug: 'capiQueue',
  admin: { useAsTitle: 'eventId', group: 'System', defaultColumns: ['eventName', 'eventId', 'status', 'attempts', 'nextAttemptAt'] },
  fields: [
    { name: 'eventName', type: 'text', index: true },
    { name: 'eventId', type: 'text', index: true },
    { name: 'payload', type: 'json' },
    { name: 'status', type: 'select', defaultValue: 'pending', index: true, options: ['pending', 'sent', 'failed'].map((v) => ({ label: v, value: v })) },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'nextAttemptAt', type: 'date', index: true },
    { name: 'error', type: 'text' },
  ],
}
