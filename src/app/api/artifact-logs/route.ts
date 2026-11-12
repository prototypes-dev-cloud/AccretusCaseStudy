/**
 * GET  /api/artifact-logs  → scoped to caller's identity
 * POST /api/artifact-logs  → Partner User can only log against their own exchanges;
 *                            QI Admin can log against any exchange.
 */
import { NextRequest } from 'next/server';
import { ensureDbReady } from '@/lib/startup';
import { getAllArtifactLogs, getArtifactLogsByPartner, insertArtifactLog, getExchangeById } from '@/lib/dal';
import { resolveIdentity, getScopedPartnerId } from '@/lib/serverAuth';
import { ArtifactLog } from '@/types';

export async function GET(req: NextRequest) {
  ensureDbReady();

  const auth = resolveIdentity(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const scopedPartnerId = getScopedPartnerId(auth.identity);
  const logs = scopedPartnerId
    ? getArtifactLogsByPartner(scopedPartnerId)
    : getAllArtifactLogs();

  return Response.json(logs);
}

export async function POST(req: NextRequest) {
  ensureDbReady();

  const auth = resolveIdentity(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: { partnerId: string; exchangeId: string; action: ArtifactLog['action'] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // For Partner Users: verify the exchange actually belongs to their partner.
  // This prevents a Partner User from logging activity against another partner's exchange.
  if (auth.identity.role === 'Partner User') {
    const exchange = getExchangeById(body.exchangeId);
    if (!exchange) {
      return Response.json({ error: 'Exchange not found.' }, { status: 404 });
    }
    if (exchange.partnerId !== auth.identity.partnerId) {
      return Response.json(
        { error: 'Forbidden: exchange does not belong to your partner account.' },
        { status: 403 }
      );
    }
    // Also ignore whatever partnerId was sent in the body — use the one from the header
    body.partnerId = auth.identity.partnerId!;
  }

  const log = insertArtifactLog(body.partnerId, body.exchangeId, body.action);
  return Response.json(log, { status: 201 });
}
