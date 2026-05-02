import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');
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

function parseBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === undefined || value === null) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(normalized);
  }
  return false;
}

async function flaskGetAssets(guildId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) {
    return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  }
  
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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const guildId = url.searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  try {
    const result = await flaskGetAssets(guildId);
    if (!result.ok) {
      return NextResponse.json(result.data, { status: result.status });
    }

    const assets = result.data?.data?.data ?? result.data?.data ?? result.data?.assets ?? [];
    
    // Filter to only discoverable assets and return only safe fields
    const publicAssets = (assets as any[])
      .filter((asset) => {
        const discoverable = asset?.discoverable;
        const discoverableValue = discoverable == null ? false : parseBoolean(discoverable);
        return discoverableValue === true;
      })
      .map((asset) => ({
        asset_id: String(asset.asset_id ?? asset.id ?? ''),
        name: typeof asset.name === 'string' ? asset.name : '',
        description: typeof asset.description === 'string' ? asset.description : '',
        asset_type: String(asset.asset_type ?? 'web'),
        required_hours: typeof asset.required_hours === 'number' ? asset.required_hours : 0,
      }));

    return NextResponse.json(
      { success: true, assets: publicAssets },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/asset-access/public-assets]', error);
    return NextResponse.json({ error: 'Unable to load public assets' }, { status: 500 });
  }
}
