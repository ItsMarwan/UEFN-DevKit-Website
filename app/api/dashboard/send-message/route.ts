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

async function verifyGuildAccess(accessToken: string, guildId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const guilds: Array<{ id: string; owner: boolean; permissions: number }> = await res.json();
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) return false;
    const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions, 10) : guild.permissions;
    return guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0;
  } catch {
    return false;
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

async function flaskSendInfoMessage(guildId: string, parameters: Record<string, unknown>) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) {
    return { ok: false, status: 503, data: { error: 'Flask not configured' } };
  }

  const body = { parameters };
  const bodyStr = JSON.stringify(body);

  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/send-info-message`, {
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

export async function POST(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const { guildId, channelId, assetUrl, assetId, assetName, roleId } = body as Record<string, unknown>;
  const requiredHours = Number(body.requiredHours ?? 0);

  if (!guildId || !channelId || !assetUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!(await verifyGuildAccess(accessToken, String(guildId)))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const channelIdValue = String(channelId).trim();
  const assetUrlValue = String(assetUrl).trim();
  const assetIdValue = assetId ? String(assetId).trim() : '';
  const assetNameValue = assetName ? String(assetName).trim() : '';
  const roleIdValue = roleId ? String(roleId).trim() : '';

  let assetUrlAbsolute = assetUrlValue;
  if (!/^https?:\/\//i.test(assetUrlAbsolute) && assetUrlAbsolute.startsWith('/')) {
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || '';
    if (origin) {
      assetUrlAbsolute = `${origin}${assetUrlAbsolute}`;
    }
  }

  const parameters: Record<string, unknown> = {
    channel_id: channelIdValue,
    asset_url: assetUrlAbsolute,
    required_hours: Number.isFinite(requiredHours) && requiredHours >= 0 ? requiredHours : 0,
  };
  if (assetIdValue) parameters.asset_id = assetIdValue;
  if (assetNameValue) parameters.asset_name = assetNameValue;
  if (roleIdValue) parameters.required_role_id = roleIdValue;

  const result = await flaskSendInfoMessage(String(guildId), parameters);
  return NextResponse.json(result.data, { status: result.ok ? 200 : result.status });
}