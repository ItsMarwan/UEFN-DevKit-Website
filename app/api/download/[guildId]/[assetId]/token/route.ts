import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import path from 'path';
import { createDownloadToken } from '@/lib/download-token-store';

export const dynamic = 'force-dynamic';

function getSessionToken(req: NextRequest): string | null {
  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as { access_token: string; expires_at: number };
    if (!session.access_token || Date.now() > session.expires_at) return null;
    return session.access_token;
  } catch {
    return null;
  }
}

async function verifyUserEligibility(req: NextRequest, guildId: string, assetId: string, requiredHours: number) {
  const eligibilityUrl = new URL('/api/asset-link/check-eligibility', req.url).toString();
  const res = await fetch(eligibilityUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ guildId, assetId, requiredHours }),
  });

  if (!res.ok) return null;
  return res.json();
}

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');
  return `Bearer ${timestamp}.${signature}`;
}

function makeHeaders(guildId: string, bodyStr: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: generateAuthHeader(ENTERPRISE_API_TOKEN!, bodyStr),
    'X-Discord-Server-ID': guildId,
    'X-Internal-API-Key': process.env.FLASK_INTERNAL_API_KEY || '',
    'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN!,
    Origin: ENTERPRISE_ORIGIN,
  };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\"\n\r\t]+/g, '_').trim();
}

function parseStorageUrl(storageUrl: string) {
  if (!storageUrl.startsWith('storage://')) return null;
  const [bucket, ...pathSegments] = storageUrl.replace('storage://', '').split('/');
  if (!bucket || pathSegments.length === 0 || bucket.includes('..')) return null;

  const rawPath = path.posix.join(...pathSegments);
  const normalizedPath = path.posix.normalize(rawPath);
  if (
    normalizedPath === '' ||
    normalizedPath.startsWith('/') ||
    normalizedPath.startsWith('..') ||
    normalizedPath.includes('/..')
  ) {
    return null;
  }

  return { bucket, path: normalizedPath };
}

async function flaskGetAssets(guildId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_assets', method: 'GET', parameters: {} };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: 'POST',
      headers: makeHeaders(guildId, bodyStr),
      body: bodyStr,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch (e) {
    return { ok: false, status: 500, data: { error: String(e) } };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string; assetId: string }> }
) {
  const { guildId, assetId } = await params;
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await flaskGetAssets(guildId);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });

  const assets = result.data?.data?.data ?? result.data?.data ?? result.data?.assets ?? [];
  const asset = (assets as any[]).find((item) => String(item.asset_id ?? item.id) === assetId);
  if (!asset || !asset.storage_url) {
    return NextResponse.json({ error: 'Hosted asset not found' }, { status: 404 });
  }

  const eligibility = await verifyUserEligibility(req, guildId, assetId, Number(asset.required_hours ?? 0));
  if (!eligibility || eligibility.eligible !== true) {
    return NextResponse.json({ error: eligibility?.reason ?? 'Not eligible to download this asset' }, { status: 403 });
  }

  const storageUrl = asset.storage_url.toString();
  if (!storageUrl.startsWith('storage://')) {
    try {
      const parsedUrl = new URL(storageUrl);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return NextResponse.json({ error: 'Unsupported external asset URL' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid external asset URL' }, { status: 404 });
    }

    return NextResponse.json({ success: true, downloadUrl: storageUrl }, { status: 200 });
  }

  const parsed = parseStorageUrl(storageUrl);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid hosted asset storage URL' }, { status: 404 });
  }

  const filePath = parsed.path;
  const ext = path.extname(filePath);
  const baseFilename = asset.name ? sanitizeFilename(String(asset.name)) : path.basename(filePath);
  const filename = baseFilename.endsWith(ext) ? baseFilename : `${baseFilename}${ext}`;

  const token = createDownloadToken({
    guildId,
    assetId,
    filename,
  });

  return NextResponse.json({ success: true, downloadUrl: `/api/download/${guildId}/${assetId}/${token}` }, { status: 200 });
}
