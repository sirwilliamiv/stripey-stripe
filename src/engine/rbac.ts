import type { Role } from './types'

// Routes that require specific roles. Prefix match.
const RESTRICTED: Array<{ prefix: string; allowedRoles: Role[] }> = [
  { prefix: '/stripeland/sellers', allowedRoles: ['seller', 'platform_admin'] },
  { prefix: '/stripeland/radar', allowedRoles: ['seller', 'platform_admin'] },
  { prefix: '/flowlance/onboard', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/wallet', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/cards', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/capital', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/stackd/invoice', allowedRoles: ['enterprise', 'platform_admin'] },
]

export function canAccess(role: Role, pathname: string): boolean {
  if (role === 'platform_admin') return true
  for (const rule of RESTRICTED) {
    if (pathname.startsWith(rule.prefix)) {
      return rule.allowedRoles.includes(role)
    }
  }
  return true
}

export type Permission =
  | 'view_dashboard'
  | 'run_payment'
  | 'run_subscription'
  | 'view_connect'
  | 'manage_connect'
  | 'view_admin_panel'
  | 'trigger_failure_modes'
  | 'run_kyc'
  | 'run_banking'
  | 'run_crypto'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  buyer: ['view_dashboard', 'run_payment'],
  seller: ['view_dashboard', 'run_payment', 'run_subscription', 'view_connect', 'run_kyc'],
  freelancer: ['view_dashboard', 'run_payment', 'run_subscription', 'view_connect', 'run_kyc'],
  enterprise: [
    'view_dashboard',
    'run_payment',
    'run_subscription',
    'view_connect',
    'manage_connect',
    'run_kyc',
    'run_banking',
  ],
  platform_admin: [
    'view_dashboard',
    'run_payment',
    'run_subscription',
    'view_connect',
    'manage_connect',
    'view_admin_panel',
    'trigger_failure_modes',
    'run_kyc',
    'run_banking',
    'run_crypto',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}
