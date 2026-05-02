import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import path from 'path';
import { consumeDownloadToken } from '@/lib/download-token-store';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function flaskIncrementDownloadCount(guildId: string, assetId: string, currentCount: number) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return;
  const updatedCount = currentCount + 1;
  const body = { endpoint: 'guild_assets_update', method: 'PATCH', parameters: { asset_id: assetId, download_count: updatedCount } };
  const bodyStr = JSON.stringify(body);
  try {
    await fetch(`${FLASK_API_URL}/api/v1/config`, {
      method: 'PATCH',
      headers: makeHeaders(guildId, bodyStr),
      body: bodyStr,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Ignore tracking failures so downloads still succeed.
  }
}

function createSupabaseAdmin() {
  const url = SUPABASE_URL;
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ guildId: string; assetId: string; timestamp: string }> }
) {
  const { guildId, assetId, timestamp: token } = await params;
  const tokenData = consumeDownloadToken(token);
  if (!tokenData || tokenData.guildId !== guildId || tokenData.assetId !== assetId) {
    return NextResponse.json({ error: 'Invalid or expired download token' }, { status: 403 });
  }

  const result = await flaskGetAssets(guildId);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });

  const assets = result.data?.data?.data ?? result.data?.data ?? result.data?.assets ?? [];
  const asset = (assets as any[]).find((item) => String(item.asset_id ?? item.id) === assetId);

  if (!asset || !asset.storage_url || !asset.storage_url.toString().startsWith('storage://')) {
    return NextResponse.json({ error: 'Hosted asset not found' }, { status: 404 });
  }

  const currentDownloads = Number(asset.download_count ?? asset.downloads ?? 0);
  void flaskIncrementDownloadCount(guildId, assetId, currentDownloads);

  const parsed = parseStorageUrl(asset.storage_url.toString());
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid hosted asset storage URL' }, { status: 404 });
  }

  const { bucket, path: filePath } = parsed;

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || 'Unable to create download link' }, { status: 500 });
    }

    const signedResponse = await fetch(data.signedUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!signedResponse.ok) {
      const errorText = await signedResponse.text().catch(() => 'Unable to fetch file');
      return NextResponse.json({ error: errorText }, { status: signedResponse.status || 502 });
    }

    const proxiedHeaders = new Headers(signedResponse.headers);
    proxiedHeaders.set('Cache-Control', 'no-store');
    proxiedHeaders.set('Content-Disposition', `attachment; filename="${tokenData.filename}"`);

    return new Response(signedResponse.body, {
      status: signedResponse.status,
      headers: proxiedHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
