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
