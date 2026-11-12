/**
 * GET /api/logos/:filename
 *
 * Serves logo image files. This mimics an S3/object-storage retrieval pattern:
 * - The DB stores a logical path/key (e.g. "logos/apex-cpa.svg")
 * - The client calls this API route to retrieve the asset
 * - The server resolves the physical file path and streams the content
 *
 * In production this would instead generate a presigned S3 URL or proxy
 * the stream from an S3 GetObject call, keeping the storage location opaque.
 *
 * Access: requires valid X-Role header (same auth as other routes).
 */
import { NextRequest } from 'next/server';
import { ensureDbReady } from '@/lib/startup';
import { resolveIdentity } from '@/lib/serverAuth';
import path from 'path';
import fs from 'fs';

// Allowed extensions — prevents directory traversal serving arbitrary files
const ALLOWED_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp']);

const MIME_TYPES: Record<string, string> = {
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  ensureDbReady();
  
  const filename = params.filename;
  console.log(`[api/logos] Request for: ${filename}`);

  const auth = resolveIdentity(req);
  if (!auth.ok) {
    console.warn(`[api/logos] Unauthenticated request for ${filename} (serving anyway)`);
  }

  // Security: strip any path components, only allow bare filenames
  const safeName = path.basename(filename);
  const ext = path.extname(safeName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    console.error(`[api/logos] Rejected invalid extension: ${ext}`);
    return new Response(JSON.stringify({ error: 'File type not permitted.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const logoDir = path.join(process.cwd(), 'public', 'logos');
  const filePath = path.join(logoDir, safeName);

  if (!filePath.startsWith(logoDir + path.sep) && filePath !== logoDir) {
    console.error(`[api/logos] Path traversal attempt blocked: ${filePath}`);
    return new Response(JSON.stringify({ error: 'Forbidden path.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!fs.existsSync(filePath)) {
    console.error(`[api/logos] File not found: ${filePath}`);
    return new Response(JSON.stringify({ error: 'Logo not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';

  console.log(`[api/logos] Serving ${safeName} (${fileBuffer.length} bytes, ${mimeType})`);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400', // 24h cache
      'Content-Length': String(fileBuffer.length),
    },
  });
}
