import type { Access } from 'payload'

/**
 * Authenticated-staff-only access. Accounting collections carry the ledger and COGS — never public.
 * Field-level role masking (accounts vs packer vs support, §4.6) lands in Phase 9 RBAC; until then
 * any authenticated admin user may read, and the integrity hooks (balance, closed-period, renumber)
 * are what protect the books.
 */
export const staffOnly: Access = ({ req }) => Boolean(req.user)
