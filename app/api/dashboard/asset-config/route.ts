import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

const EDITABLE_FIELDS: Record<string, { type: 'boolean' | 'string' | 'number' }> = {
  asset_channel_id: { type: 'string' },
  info_channel_id: { type: 'string' },
  required_role_id: { type: 'string' },
  required_hours: { type: 'number' },
  required_days: { type: 'number' },
  cooldown_hours: { type: 'number' },
  enabled: { type: 'boolean' },
};

function extractAssetConfig(raw: Record<string, unknown> | null | undefined) {
  const requiredHours = typeof raw?.required_hours === 'number'
    ? raw.required_hours
    : typeof raw?.required_days === 'number'
      ? raw.required_days * 24
      : 72;

  return {
    asset_channel_id: raw?.asset_channel_id ?? null,
    info_channel_id: raw?.info_channel_id ?? null,
    required_role_id: raw?.required_role_id ?? null,
    required_hours: requiredHours,
    cooldown_hours: typeof raw?.cooldown_hours === 'number' ? raw.cooldown_hours : 24,
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : false,
  };
}

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

function validateField(key: string, value: unknown): { ok: boolean; error?: string } {
  const schema = EDITABLE_FIELDS[key];
  if (!schema) return { ok: false, error: `Unknown field '${key}'` };
  if (value === null) {
    if (schema.type === 'string') return { ok: true };
    return { ok: false, error: `Field '${key}' cannot be null` };
  }
  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') return { ok: false, error: `Field '${key}' must be a boolean` };
  } else if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value) || !Number.isInteger(value))
      return { ok: false, error: `Field '${key}' must be an integer number` };
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') return { ok: false, error: `Field '${key}' must be a string` };
    if (['asset_channel_id', 'info_channel_id', 'required_role_id'].includes(key) && value !== '' && !/^[0-9]+$/.test(value)) {
      return { ok: false, error: `Field '${key}' must be a Discord snowflake ID` };
    }
  }
  return { ok: true };
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

async function flaskGetConfig(guildId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_settings', method: 'GET', parameters: {} };
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

async function flaskPatchConfig(guildId: string, fields: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_settings_update', method: 'POST', parameters: { fields } };
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
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });

  const result = await flaskGetConfig(guildId);
  if (!result.ok) return NextResponse.json(result.data, { status: result.status });

  const raw = result.data?.data?.data ?? result.data?.data ?? result.data ?? {};
  return NextResponse.json({ success: true, endpoint: 'asset_config', data: extractAssetConfig(raw) }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
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

  if (typeof body !== 'object' || Array.isArray(body) || body === null)
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const { ok, error } = validateField(key, value);
    if (!ok) return NextResponse.json({ error }, { status: 422 });
    sanitized[key] = value;
  }

  if (Object.keys(sanitized).length === 0)
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });

  const result = await flaskPatchConfig(guildId, sanitized);
  return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
}
