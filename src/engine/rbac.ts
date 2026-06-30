import type { Role } from './types'

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
