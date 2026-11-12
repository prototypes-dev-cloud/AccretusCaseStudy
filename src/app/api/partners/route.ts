import { ensureDbReady } from '@/lib/startup';
import { getAllPartners } from '@/lib/dal';

export async function GET() {
  ensureDbReady();
  return Response.json(getAllPartners());
}
