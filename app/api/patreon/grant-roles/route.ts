// app/api/patreon/grant-roles/route.ts
// Verifies the logged-in Discord user's email against patreon_users in Supabase
// and grants the corresponding Discord role(s) using the bot token.
//
// Database tables used (from patreon.py cog):
//   patreon_users       — guild_id, email, full_name, status, raw_tiers
//   patreon_tier_roles  — guild_id, tier_name, role_id
//   patreon_item_roles  — guild_id, item_name, role_id
//   patreon_configs     — guild_id (used to confirm setup exists)

import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  // 1. Verify session cookie (same dashboard_session cookie used everywhere)
  const raw = req.cookies.get('dashboard_session')?.value;
  if (!raw) {
    return NextResponse.json(
      { error: 'Not authenticated. Please log in with Discord first.' },
      { status: 401 }
    );
  }

  let session: { access_token: string; expires_at: number };
  try {
    session = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  if (!session.access_token || Date.now() > session.expires_at) {
    return NextResponse.json(
      { error: 'Session expired. Please log in again.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { guildId } = body as { guildId?: string };

  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  // 2. Fetch the Discord user (need email + Discord ID)
  const userRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  if (!userRes.ok) {
    return NextResponse.json(
      { error: 'Could not fetch your Discord account. Please log in again.' },
      { status: 401 }
    );
  }

  const discordUser = await userRes.json();
  const discordEmail: string | undefined = discordUser.email;
  const discordId: string = discordUser.id;

  if (!discordEmail) {
    return NextResponse.json(
      {
        error:
          'Your Discord account does not have a verified email address. Please verify your email in Discord settings first.',
      },
      { status: 400 }
    );
  }

  // 3. Connect to Supabase (using service role — bypasses RLS)
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured. Contact server admin.' },
      { status: 503 }
    );
  }

  // 4. Confirm patreon is configured for this guild
  const { data: configData } = await supabase
    .from('patreon_configs')
    .select('guild_id')
    .eq('guild_id', guildId)
    .limit(1);

  if (!configData || configData.length === 0) {
    return NextResponse.json(
      { error: 'Patreon is not configured for this server. Ask your admin to run /patreon setup.' },
      { status: 404 }
    );
  }

  // 5. Look up the user's email in patreon_users for this guild
  //    The patreon.py sync stores: guild_id, email, full_name, status, raw_tiers
  const { data: patreonUsers } = await supabase
    .from('patreon_users')
    .select('email, full_name, status, raw_tiers, patreon_user_id')
    .eq('guild_id', guildId)
    .eq('email', discordEmail)
    .limit(1);

  if (!patreonUsers || patreonUsers.length === 0) {
    return NextResponse.json(
      {
        error: `No active Patreon subscription found for ${discordEmail}. Make sure:\n• You are subscribed to this creator's Patreon\n• Your Patreon email matches your Discord email (${discordEmail})\n• The server admin has run /patreon sync recently`,
      },
      { status: 404 }
    );
  }

  const patreonUser = patreonUsers[0];

  // 6. Check subscription is active
  const patronStatus: string = patreonUser.status ?? '';
  if (patronStatus && patronStatus !== 'active_patron' && patronStatus !== 'active') {
    return NextResponse.json(
      {
        error: `Your Patreon subscription is not currently active (status: ${patronStatus}). Please check your Patreon account.`,
      },
      { status: 403 }
    );
  }

  // 7. Extract tier name(s) from raw_tiers
  //    raw_tiers is stored as JSON array: [{ attributes: { title: "Gold" }, ... }]
  const rawTiers: any[] = patreonUser.raw_tiers ?? [];
  const tierNames: string[] = rawTiers
    .map((t: any) => t?.attributes?.title as string)
    .filter(Boolean);

  if (tierNames.length === 0) {
    return NextResponse.json(
      {
        error:
          'Your Patreon subscription does not include any tiers. Please contact the server admin.',
      },
      { status: 404 }
    );
  }

  // 8. Fetch tier role mappings from Supabase
  const { data: tierRoleMappings } = await supabase
    .from('patreon_tier_roles')
    .select('tier_name, role_id')
    .eq('guild_id', guildId)
    .in('tier_name', tierNames);

  if (!tierRoleMappings || tierRoleMappings.length === 0) {
    return NextResponse.json(
      {
        error: `No Discord roles are configured for your tier(s): ${tierNames.join(', ')}. Ask the server admin to run /patreon set-tier-role.`,
      },
      { status: 404 }
    );
  }

  // 9. Also check item roles (best-effort, no error if none configured)
  const { data: itemRoleMappings } = await supabase
    .from('patreon_item_roles')
    .select('item_name, role_id')
    .eq('guild_id', guildId);

  // Collect all role IDs to grant (tier + item if applicable)
  const allRoleIds = new Set<string>(tierRoleMappings.map(m => m.role_id));
  // Item roles would need item-level data from raw_tiers — skip for now unless needed

  // 10. Grant roles via Discord bot token
  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: 'Bot token not configured. Contact server admin.' },
      { status: 503 }
    );
  }

  // Also resolve role names for the success response
  let discordRoleNames: Map<string, string> = new Map();
  try {
    const rolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
      cache: 'no-store',
    });
    if (rolesRes.ok) {
      const roles: Array<{ id: string; name: string }> = await rolesRes.json();
      discordRoleNames = new Map(roles.map(r => [r.id, r.name]));
    }
  } catch {
    // names stay blank
  }

  const grantedRoles: string[] = [];
  const failedRoles: string[] = [];

  for (const roleId of allRoleIds) {
    try {
      const grantRes = await fetch(
        `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            'Content-Length': '0',
          },
        }
      );

      if (grantRes.ok || grantRes.status === 204) {
        const roleName = discordRoleNames.get(roleId) ?? roleId;
        grantedRoles.push(roleName);
      } else {
        const roleName = discordRoleNames.get(roleId) ?? roleId;
        console.error(
          `[patreon/grant-roles] Failed to grant role ${roleId} (${roleName}) to ${discordId}: ${grantRes.status}`
        );
        failedRoles.push(roleName);
      }
    } catch (e) {
      const roleName = discordRoleNames.get(roleId) ?? roleId;
      console.error(`[patreon/grant-roles] Exception granting ${roleId}:`, e);
      failedRoles.push(roleName);
    }
  }

  // 11. Optionally: store discord_id in patreon_users for future auto-sync
  //     This makes future role assignments instant (no email lookup needed)
  try {
    await supabase
      .from('patreon_users')
      .update({ discord_id: discordId })
      .eq('guild_id', guildId)
      .eq('email', discordEmail);
  } catch {
    // non-critical — discord_id column may not exist yet
  }

  // 12. Send verification result to bot API for Discord notification and webhook
  const verificationSuccess = grantedRoles.length > 0;
  const failureReason = failedRoles.length > 0
    ? `Failed to grant roles: ${failedRoles.join(', ')}`
    : (grantedRoles.length === 0 ? 'Could not grant any roles' : null);

  try {
    const botApiUrl = process.env.FLASK_API_URL || 'http://localhost:5000';
    const verificationPayload = {
      guild_id: guildId,
      user_id: discordId,
      username: `${discordUser.username}#${discordUser.discriminator || '0000'}`,
      success: verificationSuccess,
      failure_reason: failureReason,
      granted_roles: grantedRoles,
      patron_name: patreonUser.full_name,
    };

    const verificationRes = await fetch(`${botApiUrl}/api/v1/patreon/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload),
    });

    if (!verificationRes.ok) {
      console.error(
        `[patreon/grant-roles] Bot API returned ${verificationRes.status}`,
        await verificationRes.text()
      );
    }
  } catch (e) {
    console.error('[patreon/grant-roles] Failed to notify bot API:', e);
    // Non-critical — user still gets result on website
  }

  if (grantedRoles.length === 0) {
    return NextResponse.json(
      {
        error:
          failedRoles.length > 0
            ? `Failed to grant roles: ${failedRoles.join(', ')}. Please make sure:\n• The bot has the Manage Roles permission\n• The bot's role is positioned above the Patreon role(s) in the server settings\n• You are a member of this Discord server`
            : 'Could not grant any roles. Please contact the server admin.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    grantedRoles,
    failedRoles,
    patronName: patreonUser.full_name,
    tierNames,
    discordUser: {
      id: discordId,
      username: discordUser.username,
    },
  });
}