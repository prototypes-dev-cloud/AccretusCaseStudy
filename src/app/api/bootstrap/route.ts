/**
 * GET /api/bootstrap
 * Returns QI entity, partners, scoped exchanges, and artifact logs.
 *
 * Access control (enforced server-side via headers):
 *   Partner User  → only receives exchanges belonging to their partnerId
 *   QI Admin      → receives all exchanges across all partners
 *
 * The partnerId query param is IGNORED for scoping — only X-Partner-Id header
 * is trusted. This prevents a client from requesting another partner's data.
 */
import { NextRequest } from 'next/server';
import { ensureDbReady } from '@/lib/startup';
import { getQI, getAllPartners, getAllExchanges, getExchangesByPartner, getAllArtifactLogs, getArtifactLogsByPartner } from '@/lib/dal';
import { resolveIdentity, getScopedPartnerId } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  ensureDbReady();

  const auth = resolveIdentity(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const scopedPartnerId = getScopedPartnerId(auth.identity);

  const qi = getQI();
  const partners = getAllPartners();
  // Scoping enforced here — not from query params
  const exchanges = scopedPartnerId
    ? getExchangesByPartner(scopedPartnerId)
    : getAllExchanges();
  const artifactLogs = scopedPartnerId
    ? getArtifactLogsByPartner(scopedPartnerId)
    : getAllArtifactLogs();

  return Response.json({ qi, partners, exchanges, artifactLogs });
}
