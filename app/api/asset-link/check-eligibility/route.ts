import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const DISCORD_API = 'https://discord.com/api/v10';

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

async function fetchDiscordUserGuilds(accessToken: string) {
  const guilds: Array<any> = [];
  let after: string | undefined;

  for (let i = 0; i < 10; i += 1) {
    const url = new URL(`${DISCORD_API}/users/@me/guilds`);
    url.searchParams.set('limit', '200');
    if (after) url.searchParams.set('after', after);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const page = await res.json();
    if (!Array.isArray(page)) return null;

    guilds.push(...page);
    if (page.length < 200) break;
    after = page[page.length - 1]?.id;
    if (!after) break;
  }

  return guilds;
}

interface AssetCheckResult {
  assetId: string;
  eligible: boolean;
  reason?: string;
  hoursSinceJoin?: number;
  hoursRemaining?: number;
  unlockAt?: number;
  serverTime?: number;
}

export async function POST(req: NextRequest) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: {
    guildId?: string;
    // Legacy single-asset
    assetId?: string;
    requiredHours?: number;
    // New batch
    assetIds?: Array<{ id: string; requiredHours?: number }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { guildId } = body;
  if (!guildId) {
    return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
  }

  // Normalise into a batch — supports both legacy single-asset and new multi-asset callers
  const isBatch = Array.isArray(body.assetIds) && body.assetIds.length > 0;
  const assets: Array<{ id: string; requiredHours: number }> = isBatch
    ? body.assetIds!.map((a) => ({ id: a.id, requiredHours: a.requiredHours ?? 0 }))
    : body.assetId
      ? [{ id: body.assetId, requiredHours: body.requiredHours ?? 0 }]
      : [];

  if (assets.length === 0) {
    return NextResponse.json({ error: 'Missing assetId or assetIds' }, { status: 400 });
  }

  try {
    // Fetch user info once
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: 'no-store',
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 401 });
    }

    const user = await userRes.json();
    const userId = user.id;

    // Verify guild membership once
    const guilds = await fetchDiscordUserGuilds(sessionToken);
    if (!guilds) {
      return NextResponse.json({ error: 'Failed to fetch guild membership' }, { status: 401 });
    }

    const guildMatch = guilds.find((g) => g.id === guildId);
    if (!guildMatch) {
      const notMember: AssetCheckResult[] = assets.map((a) => ({
        assetId: a.id,
        eligible: false,
        reason: 'You are not a member of this server.',
      }));
      return NextResponse.json(isBatch ? { results: notMember } : notMember[0], { status: 200 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('[asset-link/check-eligibility] Missing DISCORD_BOT_TOKEN');
      const noBot: AssetCheckResult[] = assets.map((a) => ({
        assetId: a.id,
        eligible: false,
        reason: 'Unable to verify server membership at this time.',
      }));
      return NextResponse.json(isBatch ? { results: noBot } : noBot[0], { status: 200 });
    }

    // Fetch guild member once
    const guildMemberRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: 'no-store',
      }
    );

    if (!guildMemberRes.ok) {
      const reason =
        guildMemberRes.status === 403 || guildMemberRes.status === 404
          ? 'Unable to verify membership because the bot is not in this server or lacks permission.'
          : 'Unable to verify server join time.';
      console.error(
        '[asset-link/check-eligibility] guild member fetch failed:',
        guildMemberRes.status,
        guildMemberRes.statusText,
      );
      const failed: AssetCheckResult[] = assets.map((a) => ({ assetId: a.id, eligible: false, reason }));
      return NextResponse.json(isBatch ? { results: failed } : failed[0], { status: 200 });
    }

    const member = await guildMemberRes.json();
    if (!member.joined_at) {
      const noJoin: AssetCheckResult[] = assets.map((a) => ({
        assetId: a.id,
        eligible: false,
        reason: 'Unable to determine server join time.',
      }));
      return NextResponse.json(isBatch ? { results: noJoin } : noJoin[0], { status: 200 });
    }

    const joinedAt = new Date(member.joined_at).getTime();
    const now = Date.now();
    const hoursSinceJoin = (now - joinedAt) / (1000 * 60 * 60);

    // Evaluate each asset against the shared membership data
    const results: AssetCheckResult[] = assets.map((a) => {
      const unlockAt = joinedAt + a.requiredHours * 60 * 60 * 1000;
      if (hoursSinceJoin >= a.requiredHours) {
        return { assetId: a.id, eligible: true, hoursSinceJoin, unlockAt, serverTime: now };
      }
      const hoursRemaining = Math.ceil(a.requiredHours - hoursSinceJoin);
      return {
        assetId: a.id,
        eligible: false,
        hoursSinceJoin,
        hoursRemaining,
        unlockAt,
        serverTime: now,
        reason: `You need to wait ${hoursRemaining} more hour(s) before accessing this asset.`,
      };
    });

    // Legacy single-asset callers get a flat object; batch callers get { results: [...] }
    return NextResponse.json(isBatch ? { results } : results[0], { status: 200 });
  } catch (err) {
    console.error('[asset-link/check-eligibility]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}