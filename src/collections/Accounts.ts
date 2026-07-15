import type { CollectionConfig } from 'payload'

import { accountingAccess } from '@/lib/auth/roles'

/**
 * Chart of accounts (§4.4 / §12.1). Seeded from lib/accounting/accounts.ts. Add freely, NEVER
 * renumber — codes are referenced by every posting rule and by historical lines. The beforeChange
 * guard blocks changing a code on an existing account.
 */
export const Accounts: CollectionConfig = {
  slug: 'accounts',
  admin: { useAsTitle: 'code', group: 'Accounting', defaultColumns: ['code', 'name', 'type', 'active'] },
  access: { read: accountingAccess, create: accountingAccess, update: accountingAccess, delete: accountingAccess },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation === 'update' && originalDoc && data.code != null && data.code !== originalDoc.code) {
          throw new Error(`Account codes are permanent — cannot renumber ${originalDoc.code} → ${data.code} (§12.1). Add a new account instead.`)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { description: 'Permanent — never renumber (§12.1).' } },
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, options: ['asset', 'liability', 'equity', 'income', 'expense'].map((v) => ({ label: v, value: v })) },
    { name: 'parent', type: 'relationship', relationTo: 'accounts' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
