// app/api/patreon/guild-info/route.ts
// Returns guild info + patreon setup for the /patreon?s=SERVER_ID page.
// Uses the real Supabase table structure:
//   patreon_configs     — guild_id, access_token, campaign_id, auto_sync
//   patreon_tier_roles  — guild_id, tier_name, role_id
//   patreon_item_roles  — guild_id, item_name, role_id
import { NextRequest, NextResponse } from 'next/server';
import { isBotInGuild } from '@/lib/discord-bot-guilds';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guildId = searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  // 1. Verify bot is in guild
  const botInGuild = await isBotInGuild(guildId);
  if (!botInGuild) {
    return NextResponse.json({ error: 'Bot not in guild' }, { status: 404 });
  }

  // 2. Fetch guild info via Discord bot token
  let guild = { id: guildId, name: 'Server', icon: null as string | null };
  if (BOT_TOKEN) {
    try {
      const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
        cache: 'no-store',
      });
      if (guildRes.ok) {
        const g = await guildRes.json();
        guild = { id: g.id, name: g.name, icon: g.icon ?? null };
      }
    } catch {
      // use fallback
    }
  }

  // 3. Check Supabase for patreon_configs and tier/item roles
  const supabase = getSupabase();
  let patreonSetup = {
    setup: false,
    roles: [] as Array<{ tier_name: string; role_id: string; role_name?: string }>,
    item_roles: [] as Array<{ item_name: string; role_id: string; role_name?: string }>,
    patreon_page: 'https://patreon.com',
  };

  if (supabase) {
    try {
      // Check if patreon is configured
      const { data: configData } = await supabase
        .from('patreon_configs')
        .select('guild_id, auto_sync, campaign_id, patreon_page')
        .eq('guild_id', guildId)
        .limit(1);

      const isSetup = !!(configData && configData.length > 0);
      const patreonPage = configData?.[0]?.patreon_page || 'https://patreon.com';

      // Fetch tier role mappings
      const { data: tierRoles } = await supabase
        .from('patreon_tier_roles')
        .select('tier_name, role_id')
        .eq('guild_id', guildId);

      // Fetch item role mappings
      const { data: itemRoles } = await supabase
        .from('patreon_item_roles')
        .select('item_name, role_id')
        .eq('guild_id', guildId);

      // Optionally resolve role names from Discord
      const resolvedTierRoles = (tierRoles || []).map(r => ({
        tier_name: r.tier_name,
        role_id: r.role_id,
        role_name: undefined as string | undefined,
      }));

      const resolvedItemRoles = (itemRoles || []).map(r => ({
        item_name: r.item_name,
        role_id: r.role_id,
        role_name: undefined as string | undefined,
      }));

      // Try to resolve role names via bot token (best-effort)
      if (BOT_TOKEN && (resolvedTierRoles.length > 0 || resolvedItemRoles.length > 0)) {
        try {
          const rolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
            cache: 'no-store',
          });
          if (rolesRes.ok) {
            const discordRoles: Array<{ id: string; name: string }> = await rolesRes.json();
            const roleMap = new Map(discordRoles.map(r => [r.id, r.name]));
            for (const r of resolvedTierRoles) r.role_name = roleMap.get(r.role_id);
            for (const r of resolvedItemRoles) r.role_name = roleMap.get(r.role_id);
          }
        } catch {
          // role names stay undefined
        }
      }

      patreonSetup = {
        setup: isSetup,
        roles: resolvedTierRoles,
        item_roles: resolvedItemRoles,
        patreon_page: patreonPage,
      };
    } catch (e) {
      // patreon not configured — leave defaults
    }
  }

  return NextResponse.json({ guild, patreonSetup });
}