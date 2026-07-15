import type { Access, FieldAccess } from 'payload'

/**
 * Staff roles (§4.6). Field-level access matters here, not just collection-level: landed cost and
 * every margin figure must be invisible to `packer` and `support`. RBAC is enforced through these
 * helpers on the admin/REST API — the storefront and internal services read with overrideAccess and
 * are unaffected.
 */
export type Role = 'owner' | 'manager' | 'inventory' | 'packer' | 'accounts' | 'support'

export const ALL_ROLES: Role[] = ['owner', 'manager', 'inventory', 'packer', 'accounts', 'support']

type MaybeUser = { roles?: (Role | string)[] | null } | null | undefined

export const rolesOf = (user: MaybeUser): Role[] => ((user?.roles ?? []) as Role[])
export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean => rolesOf(user).some((r) => roles.includes(r))

/** Who may see cost/margin: everyone who handles buying or the books — NEVER packer or support. */
export const canSeeCost = (user: MaybeUser): boolean => hasRole(user, 'owner', 'manager', 'inventory', 'accounts')
/** Who may touch the accounting collections (§4.6). */
export const canAccounting = (user: MaybeUser): boolean => hasRole(user, 'owner', 'manager', 'accounts')
/** Who may manage inventory (products, variants, lots, POs, receive). */
export const canInventory = (user: MaybeUser): boolean => hasRole(user, 'owner', 'manager', 'inventory')

// ── Collection access (req.user) ───────────────────────────────────────────
export const isStaff: Access = ({ req }) => Boolean(req.user)
export const accountingAccess: Access = ({ req }) => canAccounting(req.user as MaybeUser)
export const inventoryAccess: Access = ({ req }) => canInventory(req.user as MaybeUser)

// ── Field access (req.user) ────────────────────────────────────────────────
/** Field read guard for cost/margin fields — hides them from packer/support (§4.6). */
export const costFieldRead: FieldAccess = ({ req }) => canSeeCost(req.user as MaybeUser)
