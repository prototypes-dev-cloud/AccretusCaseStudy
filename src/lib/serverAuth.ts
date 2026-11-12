/**
 * Server-side request identity resolution.
 *
 * In production this would verify a signed JWT or session cookie.
 * For this demo, we use two custom request headers that the client always sends:
 *   X-Role:       "Partner User" | "QI Admin"
 *   X-Partner-Id: "<partner id>"  (only meaningful for Partner User role)
 *
 * The backend NEVER trusts query params or body fields for scoping decisions —
 * only these headers. A Partner User is ALWAYS restricted to their own partnerId
 * regardless of what query params arrive.
 */

import { NextRequest } from 'next/server';
import { getPartnerById } from './dal';

export type CallerRole = 'Partner User' | 'QI Admin';

export interface CallerIdentity {
  role: CallerRole;
  partnerId: string | null; // null for QI Admin
}

/**
 * Resolves the caller identity from request headers.
 * Returns 401-style error info if identity cannot be determined.
 */
export function resolveIdentity(req: NextRequest):
  | { ok: true; identity: CallerIdentity }
  | { ok: false; status: number; error: string } {

  const role = req.headers.get('x-role') as CallerRole | null;
  const partnerId = req.headers.get('x-partner-id');

  if (!role || !['Partner User', 'QI Admin'].includes(role)) {
    return { ok: false, status: 401, error: 'Missing or invalid X-Role header.' };
  }

  if (role === 'Partner User') {
    if (!partnerId) {
      return { ok: false, status: 401, error: 'Missing X-Partner-Id header for Partner User.' };
    }
    // Verify the partner actually exists in the DB
    const partner = getPartnerById(partnerId);
    if (!partner) {
      return { ok: false, status: 403, error: `Partner '${partnerId}' not found.` };
    }
    return { ok: true, identity: { role, partnerId } };
  }

  // QI Admin — no partner scoping
  return { ok: true, identity: { role: 'QI Admin', partnerId: null } };
}

/**
 * Convenience: returns the partner-scoped partner id for a Partner User,
 * or null for QI Admin. This is what routes use to scope DB queries.
 */
export function getScopedPartnerId(identity: CallerIdentity): string | null {
  return identity.role === 'Partner User' ? identity.partnerId : null;
}
