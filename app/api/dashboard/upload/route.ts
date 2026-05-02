import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

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
  const res = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const guilds = await res.json();
  return Array.isArray(guilds) && guilds.some((guild: any) => {
    const perms = typeof guild.permissions === 'string' ? parseInt(guild.permissions, 10) : guild.permissions;
    return guild.id === guildId && (guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0);
  });
}

async function getServerTier(guildId: string, cookieValue?: string): Promise<string | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !cookieValue) return null;

  try {
    const res = await fetch(`${appUrl}/api/dashboard/server-config?guildId=${encodeURIComponent(guildId)}`, {
      headers: { Cookie: `dashboard_session=${cookieValue}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data?.data ?? json?.data ?? json;
    return typeof data?.server_tier === 'string' ? data.server_tier : null;
  } catch {
    return null;
  }
}

function createSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const guildId = new URL(req.url).searchParams.get('guildId');
  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  const accessToken = getSessionToken(req);
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!(await verifyGuildAccess(accessToken, guildId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tier = await getServerTier(guildId, req.cookies.get('dashboard_session')?.value);
  if (tier !== 'premium' && tier !== 'enterprise') {
    return NextResponse.json({ error: 'File hosting requires premium or enterprise server tier.' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const maxSize = tier === 'enterprise' ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Upload exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` }, { status: 413 });
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+|_+$/g, '');
    const entryName = `${guildId}/${crypto.randomUUID()}-${safeName}`;
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(entryName, fileBuffer, { contentType: file.type || 'application/octet-stream' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, storage_url: `storage://${SUPABASE_BUCKET}/${entryName}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 });
  }
}
