// app/api/dashboard/data/route.ts
// Fetches endpoint data for the dashboard tabs. Session-cookie authenticated only.
// GitHub readers cannot call this — no valid session = 401.
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

// Add request timeout (in ms)
const REQUEST_TIMEOUT = 15000;
const FLASK_TIMEOUT = 10000;

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');
  return `Bearer ${timestamp}.${signature}`;
}

// Create fetch with timeout
async function fetchWithTimeout(url: string, init?: Omit<RequestInit, 'signal'>, timeoutMs: number = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function flaskFetch(endpoint: string, guildId: string, parameters: Record<string, unknown> = {}) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { success: false, data: null };
  const body = { endpoint, method: 'GET', parameters };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetchWithTimeout(`${FLASK_API_URL}/api/v1/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr),
        'X-Discord-Server-ID': guildId,
        'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
        Origin: ENTERPRISE_ORIGIN,
      },
      body: bodyStr,
      cache: 'no-store',
    }, FLASK_TIMEOUT);
    if (!res.ok) { console.warn(`[data] ${endpoint} ${res.status}`); return { success: false, data: null }; }
    const json = await res.json();
    return { success: true, data: json?.data ?? null };
  } catch (e) {
    console.warn(`[data] ${endpoint} fetch error:`, e);
    return { success: false, data: null };
  }
}

const ALLOWED_ENDPOINTS = ['customers', 'verse_scripts', 'members', 'trackers', 'guild_settings', 'logs', 'files', 'reports', 'sellers', 'statistics', 'subscriptions', 'patreon_setup', 'patreon_verify_email'];
const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(req: NextRequest) {
  try {
    // Auth: httpOnly session cookie — cannot be faked from browser JS or GitHub readers
    const raw = req.cookies.get('dashboard_session')?.value;
    if (!raw) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    let session: { access_token: string; expires_at: number };
    try { session = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Bad session' }, { status: 401 }); }
    if (!session.access_token || Date.now() > session.expires_at)
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get('guildId');
    const endpoint = searchParams.get('endpoint');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint))
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });

    // Verify guild permission via Discord — can't be spoofed, uses their real token
    const guildsRes = await fetchWithTimeout(`${DISCORD_API}/users/@me/guilds?limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    }, 8000);
    if (!guildsRes.ok) return NextResponse.json({ error: 'Could not verify guild access' }, { status: 401 });

    const userGuilds: Array<{ id: string; owner: boolean; permissions: number }> = await guildsRes.json();
    const guild = userGuilds.find(g => g.id === guildId);
    if (!guild) return NextResponse.json({ error: 'Not in this server' }, { status: 403 });

    const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions) : guild.permissions;
    if (!guild.owner && (perms & 0x8) === 0 && (perms & 0x20) === 0)
      return NextResponse.json({ error: 'No manage permission' }, { status: 403 });

    // Build parameters per endpoint
    const params: Record<string, unknown> = { limit, offset };
    if (endpoint === 'customers') params.filter = searchParams.get('filter') ?? 'all';
    if (endpoint === 'verse_scripts') params.search = searchParams.get('search') ?? '';
    if (endpoint === 'trackers') params.type = searchParams.get('type') ?? '';
    if (endpoint === 'members') params.role = searchParams.get('role') ?? '';

    // Special handling for logs endpoint — fetch from command-logs API
    if (endpoint === 'logs') {
      const protocol = req.headers.get('x-forwarded-proto') ?? 'http';
      const host = req.headers.get('host') ?? 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      
      try {
        const logsRes = await fetchWithTimeout(`${baseUrl}/api/dashboard/command-logs?guild_id=${guildId}&limit=${limit}&offset=${offset}`, {
          headers: {
            'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
          },
          cache: 'no-store',
        }, FLASK_TIMEOUT);
        if (!logsRes.ok) {
          console.warn(`[data] logs endpoint ${logsRes.status}`);
          return NextResponse.json({ success: false, data: [] });
        }
        const logsJson = await logsRes.json();
        return NextResponse.json({
          success: true,
          data: logsJson?.data ?? [],
        });
      } catch (e) {
        console.warn(`[data] logs endpoint error:`, e);
        return NextResponse.json({ success: false, data: [] });
      }
    }

    const result = await flaskFetch(endpoint, guildId, params);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[data]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}