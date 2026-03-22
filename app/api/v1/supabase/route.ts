// app/api/v1/supabase/route.ts
/**
 * Supabase Management Endpoint
 * POST /api/v1/supabase
 *
 * All database operations go through here server-side.
 * Requires Authorization: Bearer <SUPABASE_API_TOKEN> (env var, never exposed to client).
 * The client (browser) never calls this directly — only internal server routes do.
 *
 * Supported operations:
 *   - upsert_user
 *   - get_user
 *   - get_user_stats
 *   - get_user_guilds
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

function verifyToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const expected = process.env.SUPABASE_API_TOKEN;
  if (!expected) return false;
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { operation: string; discord_id?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { operation, discord_id, data } = body;

  if (!operation) {
    return NextResponse.json({ error: 'Missing operation' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    switch (operation) {
      case 'upsert_user': {
        if (!discord_id || !data) {
          return NextResponse.json({ error: 'Missing discord_id or data' }, { status: 400 });
        }

        const upsertPayload = {
          discord_id,
          discord_username: String(data.discord_username ?? ''),
          discord_email: String(data.discord_email ?? ''),
          discord_avatar_url: String(data.discord_avatar_url ?? ''),
          managed_guild_ids: Array.isArray(data.managed_guild_ids) ? data.managed_guild_ids : [],
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: result, error } = await supabase
          .from('dashboard_users')
          .upsert(upsertPayload, { onConflict: 'discord_id' })
          .select()
          .single();

        if (error) {
          console.error('Upsert error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, user: result });
      }

      case 'get_user': {
        if (!discord_id) {
          return NextResponse.json({ error: 'Missing discord_id' }, { status: 400 });
        }

        const { data: user, error } = await supabase
          .from('dashboard_users')
          .select('discord_id, discord_username, discord_email, discord_avatar_url, created_at, last_login_at')
          .eq('discord_id', discord_id)
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ user });
      }

      case 'get_user_stats': {
        if (!discord_id) {
          return NextResponse.json({ error: 'Missing discord_id' }, { status: 400 });
        }

        const { data: user, error } = await supabase
          .from('dashboard_users')
          .select('discord_id, discord_username, discord_email, discord_avatar_url, managed_guild_ids, created_at, last_login_at, updated_at')
          .eq('discord_id', discord_id)
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ user });
      }

      case 'get_user_guilds': {
        if (!discord_id) {
          return NextResponse.json({ error: 'Missing discord_id' }, { status: 400 });
        }

        const { data: user, error } = await supabase
          .from('dashboard_users')
          .select('managed_guild_ids')
          .eq('discord_id', discord_id)
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ managed_guild_ids: user?.managed_guild_ids ?? [] });
      }

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (err) {
    console.error('Supabase API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}