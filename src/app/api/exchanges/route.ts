/**
 * GET /api/exchanges
 * Returns exchanges scoped to the caller's identity (enforced server-side).
 *   Partner User → only their own exchanges (X-Partner-Id header)
 *   QI Admin     → all exchanges
 */
import { NextRequest } from 'next/server';
import { ensureDbReady } from '@/lib/startup';
import { getAllExchanges, getExchangesByPartner } from '@/lib/dal';
import { resolveIdentity, getScopedPartnerId } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  ensureDbReady();

  const auth = resolveIdentity(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const scopedPartnerId = getScopedPartnerId(auth.identity);
  const exchanges = scopedPartnerId
    ? getExchangesByPartner(scopedPartnerId)
    : getAllExchanges();

  return Response.json(exchanges);
}
