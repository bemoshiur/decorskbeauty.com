import type { CollectionConfig } from 'payload'

/** Short-lived OTP challenges (§17.1). Staff-only; hashed codes; never public. */
export const OtpChallenges: CollectionConfig = {
  slug: 'otpChallenges',
  admin: { useAsTitle: 'phone', group: 'System', defaultColumns: ['phone', 'attempts', 'consumed', 'createdAt'] },
  // No public access — default (authenticated staff) applies for read; writes happen via overrideAccess.
  fields: [
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'lockedUntil', type: 'date' },
    { name: 'ip', type: 'text' },
    { name: 'consumed', type: 'checkbox', defaultValue: false },
  ],
}
