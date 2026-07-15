import type { Access, CollectionConfig, FieldAccess } from 'payload'

import { ALL_ROLES, hasRole, type Role } from '@/lib/auth/roles'

const asUser = (u: unknown) => u as { id?: number; roles?: Role[] } | null | undefined

/** Owner only — user management is owner-exclusive (§4.6: manager = everything EXCEPT user management). */
const ownerOnly: Access = ({ req }) => hasRole(asUser(req.user), 'owner')
/** Owner sees/edits everyone; anyone else is scoped to their own account (password/session), nothing more. */
const ownerOrSelf: Access = ({ req }) => (hasRole(asUser(req.user), 'owner') ? true : req.user ? { id: { equals: asUser(req.user)?.id } } : false)
/** Field-level owner-only (roles assignment). */
const ownerOnlyField: FieldAccess = ({ req }) => hasRole(asUser(req.user), 'owner')

/**
 * Staff accounts (§4.6 / §17.2). `roles` drives RBAC (lib/auth/roles.ts). User management is
 * owner-only, and the `roles` field is owner-only to change — a packer/support/manager cannot create
 * users or promote themselves. The first user (Payload's create-first-user flow / seed with
 * overrideAccess) bootstraps the owner. 2FA for owner + accounts is a §17.2 go-live gate (deferred).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: 'Config' },
  auth: true,
  access: {
    read: ownerOrSelf,
    create: ownerOnly,
    update: ownerOrSelf, // self may change own password; role changes are blocked at field level
    delete: ownerOnly,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['owner'],
      // Only an owner may assign or change roles — closes self-promotion / privilege escalation.
      access: { create: ownerOnlyField, update: ownerOnlyField },
      options: ALL_ROLES.map((r) => ({ label: r, value: r })),
      admin: { description: 'RBAC (§4.6). First user is owner; give real staff least-privilege roles. Only an owner can change roles. packer/support never see landed cost.' },
    },
  ],
}
