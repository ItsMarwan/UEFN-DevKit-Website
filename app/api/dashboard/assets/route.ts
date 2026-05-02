import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import path from 'path';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DESCRIPTION_MAX_LENGTH = 300;

function createSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase not configured');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function parseBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === undefined || value === null) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(normalized);
  }
  return false;
}

function parseStorageUrl(storageUrl: string) {
  if (!storageUrl.startsWith('storage://')) {
    return null;
  }

  const [bucket, ...pathSegments] = storageUrl.replace('storage://', '').split('/');
  if (!bucket || pathSegments.length === 0 || bucket.includes('..')) {
    return null;
  }

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

  return {
    bucket,
    path: normalizedPath,
  };
}

async function removeHostedFile(storageUrl: string) {
  const parsed = parseStorageUrl(storageUrl);
  if (!parsed) {
    return { ok: false, error: 'Invalid hosted storage URL' };
  }

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to remove hosted file' };
  }
}

// Asset types configuration
const ASSET_TYPES = {
  full: {
    name: 'Full',
    description: 'Complete asset storage and access control',
    availableTo: ['premium', 'enterprise'],
    fields: ['asset_channel_id', 'info_channel_id', 'required_role_id', 'required_hours', 'cooldown_hours', 'storage_enabled'],
  },
  semi: {
    name: 'Semi',
    description: 'Channel lock-only access',
    availableTo: ['premium', 'enterprise'],
    fields: ['info_channel_id', 'required_role_id', 'required_hours', 'cooldown_hours'],
  },
  web: {
    name: 'Web',
    description: 'Web-based access with hosting',
    availableTo: ['free', 'premium', 'enterprise'],
    fields: ['required_hours', 'cooldown_hours', 'storage_enabled'],
  },
};

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');
  return `Bearer ${timestamp}.${signature}`;
}

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

async function flaskCreateAsset(guildId: string, assetData: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_assets_create', method: 'POST', parameters: assetData };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/config`, {
      method: 'PATCH',
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

async function flaskUpdateAsset(guildId: string, assetId: string, assetData: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_assets_update', method: 'PATCH', parameters: { asset_id: assetId, ...assetData } };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/config`, {
      method: 'PATCH',
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

async function flaskDeleteAsset(guildId: string, assetId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_assets_delete', method: 'DELETE', parameters: { asset_id: assetId } };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/config`, {
      method: 'PATCH',
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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const guildId = url.searchParams.get('guildId');
  const assetId = url.searchParams.get('assetId');
  const secure = url.searchParams.get('secure') === 'true';
  const accessToken = getSessionToken(req);

  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  
  if (secure && !accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (!accessToken && !assetId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await flaskGetAssets(guildId);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });

  const assets = result.data?.data?.data ?? result.data?.data ?? result.data?.assets ?? [];

  if (assetId) {
    const asset = (assets as any[]).find((item) => String(item.asset_id ?? item.id) === assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    const isDiscoverable = parseBoolean(asset.discoverable);
    
    if (!isDiscoverable && !accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (!secure) {
      const { storage_url, ...safeAsset } = asset;
      return NextResponse.json({ success: true, asset: safeAsset, assetTypes: ASSET_TYPES }, { status: 200 });
    }
    
    return NextResponse.json({ success: true, asset, assetTypes: ASSET_TYPES }, { status: 200 });
  }

  return NextResponse.json({ success: true, assets, assetTypes: ASSET_TYPES }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { asset_type, ...assetData } = body;
  if (!asset_type || !ASSET_TYPES[asset_type as keyof typeof ASSET_TYPES]) {
    return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
  }

  // Enforce description length limit
  if (typeof assetData.description === 'string' && assetData.description.length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const assetWithType = { ...assetData, asset_type, enabled: true };
  const result = await flaskCreateAsset(guildId, assetWithType);
  
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });
  return NextResponse.json({ success: true, asset: result.data?.data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const guildId = new URL(req.url).searchParams.get('guildId');
  const assetId = new URL(req.url).searchParams.get('assetId');
  if (!guildId || !assetId) return NextResponse.json({ error: 'Missing guildId or assetId' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Enforce description length limit
  if (typeof body.description === 'string' && body.description.length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const result = await flaskUpdateAsset(guildId, assetId, body);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });
  
  return NextResponse.json({ success: true, asset: result.data?.data }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const guildId = new URL(req.url).searchParams.get('guildId');
  const assetId = new URL(req.url).searchParams.get('assetId');
  if (!guildId || !assetId) return NextResponse.json({ error: 'Missing guildId or assetId' }, { status: 400 });

  const assetResult = await flaskGetAssets(guildId);
  if (!assetResult.ok) return NextResponse.json(assetResult.data, { status: assetResult.status });

  const assets = assetResult.data?.data?.data ?? assetResult.data?.data ?? assetResult.data?.assets ?? [];
  const asset = (assets as any[]).find((item) => String(item.asset_id ?? item.id) === assetId);

  if (asset?.storage_url && typeof asset.storage_url === 'string' && asset.storage_url.startsWith('storage://')) {
    const removeResult = await removeHostedFile(asset.storage_url);
    if (!removeResult.ok) {
      console.error('[dashboard/assets DELETE] hosted file cleanup failed:', removeResult.error);
      return NextResponse.json({ error: `Hosted file cleanup failed: ${removeResult.error}` }, { status: 500 });
    }
  }

  const result = await flaskDeleteAsset(guildId, assetId);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });

  return NextResponse.json({ success: true }, { status: 200 });
}