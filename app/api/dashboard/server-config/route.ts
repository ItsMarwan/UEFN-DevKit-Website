// app/api/dashboard/server-config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

const EDITABLE_FIELDS: Record<string, { type: 'boolean' | 'string' | 'array' }> = {
  log_channel_id:           { type: 'string' },
  default_customer_role_id: { type: 'string' },
  encryption_enabled:       { type: 'boolean' },
  key_stored_on_server:     { type: 'boolean' },
  server_encryption_key:    { type: 'string' },
  admin_allowed_roles:      { type: 'array' },
};

const IMMUTABLE_FIELDS = new Set([
  'guild_id', 'id', 'server_tier', 'tier', 'settings',
  'updated_at', 'created_at', 'encryption_setup_at',
]);

function validateField(key: string, value: unknown): { ok: boolean; error?: string } {
  if (IMMUTABLE_FIELDS.has(key)) return { ok: false, error: `Field '${key}' is immutable` };
  const schema = EDITABLE_FIELDS[key];
  if (!schema) return { ok: false, error: `Unknown field '${key}'` };
  if (value === null) {
    if (schema.type === 'string' || schema.type === 'array') return { ok: true };
    return { ok: false, error: `Field '${key}' cannot be null` };
  }
  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean')
      return { ok: false, error: `Field '${key}' must be a boolean, got ${typeof value}` };
  } else if (schema.type === 'string') {
    if (typeof value !== 'string')
      return { ok: false, error: `Field '${key}' must be a string, got ${typeof value}` };
    if ((key === 'log_channel_id' || key === 'default_customer_role_id') && value !== '') {
      if (!/^\d+$/.test(value))
        return { ok: false, error: `Field '${key}' must be a Discord snowflake ID` };
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value))
      return { ok: false, error: `Field '${key}' must be an array` };
    for (const el of value)
      if (typeof el !== 'string')
        return { ok: false, error: `Field '${key}' array elements must be strings` };
  }
  return { ok: true };
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
    const s = JSON.parse(raw) as { access_token: string; expires_at: number };
    if (!s.access_token || Date.now() > s.expires_at) return null;
    return s.access_token;
  } catch { return null; }
}

async function verifyGuildAccess(accessToken: string, guildId: string): Promise<boolean> {
  try {
    const res = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const guilds: Array<{ id: string; owner: boolean; permissions: number }> = await res.json();
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) return false;
    const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions) : guild.permissions;
    return guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0;
  } catch { return false; }
}

function makeHeaders(guildId: string, bodyStr: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': generateAuthHeader(ENTERPRISE_API_TOKEN!, bodyStr),
    'X-Discord-Server-ID': guildId,
    'Origin': ENTERPRISE_ORIGIN,
    'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN!,
  };
}

async function flaskPost(guildId: string, parameters: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_settings', method: 'GET', parameters };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: 'POST', headers: makeHeaders(guildId, bodyStr), body: bodyStr, cache: 'no-store',
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch (e) { return { ok: false, status: 500, data: { error: String(e) } }; }
}

async function flaskPatch(guildId: string, fields: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  const body = { endpoint: 'guild_settings_update', method: 'POST', parameters: { fields } };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/config`, {
      method: 'PATCH', headers: makeHeaders(guildId, bodyStr), body: bodyStr, cache: 'no-store',
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch (e) { return { ok: false, status: 500, data: { error: String(e) } }; }
}

export async function GET(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  if (!(await verifyGuildAccess(accessToken, guildId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await flaskPost(guildId, {});
  return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
}

export async function PATCH(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  if (!(await verifyGuildAccess(accessToken, guildId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
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

  const result = await flaskPatch(guildId, sanitized);
  return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
}