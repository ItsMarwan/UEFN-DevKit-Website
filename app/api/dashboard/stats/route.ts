// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyStr}`).digest('hex');
  return `Bearer ${timestamp}.${signature}`;
}

async function tryFetchCount(
  endpoint: string,
  guildId: string,
  parameters: Record<string, unknown> = {}
): Promise<{ count: number; ok: boolean }> {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) return { count: 0, ok: false };

  const body = { endpoint, method: 'GET', parameters: { limit: 1, offset: 0, ...parameters } };
  const bodyStr = JSON.stringify(body);

  try {
    const res = await fetch(`${FLASK_API_URL}/api/v1/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr),
        'X-Discord-Server-ID': guildId,
        'Origin': ENTERPRISE_ORIGIN,
        'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
      },
      body: bodyStr,
      cache: 'no-store',
    });

    const json = await res.json();

    if (!res.ok) {
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

    const [customers, coupons, verseScripts, members, trackers] = await Promise.all([
      tryFetchCount('customers',     guildId, { filter: 'all' }),
      tryFetchCount('coupons',       guildId, { active_only: false }),
      tryFetchCount('verse_scripts', guildId, { search: '' }),
      tryFetchCount('members',       guildId, { role: '' }),
      tryFetchCount('trackers',      guildId, { type: '' }),
    ]);

    return NextResponse.json({
      customers:     customers.count,
      coupons:       coupons.count,
      verse_scripts: verseScripts.count,
      members:       members.count,
      trackers:      trackers.count,
    });
  } catch (err) {
    console.error('[stats] Unexpected error:', err);
    return NextResponse.json({ customers: 0, coupons: 0, verse_scripts: 0, members: 0, trackers: 0 });
  }
}