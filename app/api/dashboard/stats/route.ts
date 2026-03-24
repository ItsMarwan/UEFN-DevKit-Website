// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}.${bodyStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return `Bearer ${timestamp}.${signature}`;
}

// Try an endpoint — returns { count, supported } so we know if it worked
async function tryFetchCount(
  endpoint: string,
  guildId: string,
  parameters: Record<string, unknown> = {}
): Promise<{ count: number; ok: boolean }> {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { count: 0, ok: false };

  const body = { endpoint, method: 'GET', parameters: { limit: 1, offset: 0, ...parameters } };
  const bodyStr = JSON.stringify(body);
  const auth = generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr);

  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
        'X-Discord-Server-ID': guildId,
        'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
        Origin: ENTERPRISE_ORIGIN,
      },
      body: bodyStr,
      cache: 'no-store',
    });

    const json = await res.json();

    if (!res.ok) {
      // Log clearly so you know which endpoints your Flask version supports
      console.warn(`[stats] ${endpoint} unsupported (${res.status}): ${json?.error ?? ''}`);
      return { count: 0, ok: false };
    }

    const count = json?.data?.total ?? json?.data?.count ?? 0;
    return { count, ok: true };
  } catch (e) {
    console.warn(`[stats] ${endpoint} fetch error:`, e);
    return { count: 0, ok: false };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get('guildId');
    if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });

    const raw = req.cookies.get('dashboard_session')?.value;
    if (!raw) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    let session: { access_token: string; expires_at: number };
    try { session = JSON.parse(raw); } catch {
      return NextResponse.json({ error: 'Malformed session' }, { status: 401 });
    }
    if (!session.access_token || Date.now() > session.expires_at) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Run all in parallel — each call is safe and returns 0 if the endpoint
    // isn't implemented in this version of the Flask server yet.
    
    // Get the base URL from the request
    const protocol = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('host') ?? 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const [customers, verseScripts, members, trackers, commandLogs] = await Promise.all([
      tryFetchCount('customers', guildId, { filter: 'all' }),
      tryFetchCount('verse_scripts', guildId, { search: '' }),
      tryFetchCount('members', guildId, { role: '' }),
      tryFetchCount('trackers', guildId, { type: '' }),
      (async () => {
        // Fetch command logs count from the command-logs API
        try {
          const res = await fetch(`${baseUrl}/api/dashboard/command-logs?guild_id=${guildId}&limit=1&offset=0`, {
            headers: {
              'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
            },
            cache: 'no-store',
          });
          if (!res.ok) return { count: 0, ok: false };
          const json = await res.json();
          const count = json?.pagination?.total ?? 0;
          return { count, ok: true };
        } catch (e) {
          console.warn(`[stats] command_logs fetch error:`, e);
          return { count: 0, ok: false };
        }
      })(),
    ]);

    const result = {
      customers: customers.count,
      verse_scripts: verseScripts.count,
      members: members.count,
      trackers: trackers.count,
      command_logs: commandLogs.count,
    };

    // Log which endpoints are unavailable — tells you what to implement in Flask
    const unsupported = [
      !customers.ok && 'customers',
      !verseScripts.ok && 'verse_scripts',
      !members.ok && 'members',
      !trackers.ok && 'trackers',
      !commandLogs.ok && 'command_logs',
    ].filter(Boolean);

    if (unsupported.length > 0) {
      console.info(`[stats] Endpoints not yet in Flask (showing 0): ${unsupported.join(', ')}`);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[stats] Unexpected error:', err);
    return NextResponse.json({ customers: 0, verse_scripts: 0, members: 0, trackers: 0, command_logs: 0 });
  }
}