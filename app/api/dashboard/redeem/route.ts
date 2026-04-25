// app/api/dashboard/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
const DISCORD_API = 'https://discord.com/api/v10';

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

export async function POST(req: NextRequest) {
  const accessToken = getSessionToken(req);
  if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });

  if (!(await verifyGuildAccess(accessToken, guildId)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { code?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const code = body.code;
  if (typeof code !== 'string' || !code.trim())
    return NextResponse.json({ error: 'code must be a non-empty string' }, { status: 422 });

  const sanitizedCode = code.trim();
  if (!/^[a-zA-Z0-9_\-]+$/.test(sanitizedCode))
    return NextResponse.json({ error: 'code contains invalid characters' }, { status: 422 });

  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN)
    return NextResponse.json({ error: 'API not configured' }, { status: 503 });

  const payload = { endpoint: 'redeem_code', method: 'POST', parameters: { code: sanitizedCode, guild_id: guildId } };
  const bodyStr = JSON.stringify(payload);

  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr),
        'X-Discord-Server-ID': guildId,
        'X-Internal-API-Key': process.env.FLASK_INTERNAL_API_KEY || '',
        'Origin': ENTERPRISE_ORIGIN,
        'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
      },
      body: bodyStr,
      cache: 'no-store',
    });
    const responseBody = await res.json();
    if (!res.ok) {
      console.error(`[REDEEM] Flask returned ${res.status}:`, responseBody);
    }
    return NextResponse.json(responseBody, { status: res.status });
  } catch (e) {
    console.error('[REDEEM] Error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}