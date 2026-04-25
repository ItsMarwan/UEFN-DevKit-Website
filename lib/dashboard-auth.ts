import { NextRequest } from "next/server";

const DISCORD_API = "https://discord.com/api/v10";
const ALLOWED_GUILD_ID_RE = /^\d{17,20}$/;

export function getSessionToken(req: NextRequest): string | null {
  const raw = req.cookies.get("dashboard_session")?.value;
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (!session || typeof session.access_token !== "string" || typeof session.expires_at !== "number") {
      return null;
    }
    if (Date.now() > session.expires_at) {
      return null;
    }
    return session.access_token;
  } catch {
    return null;
  }
}

export function validateGuildId(guildId?: string | null): string | null {
  if (!guildId) return null;
  const trimmed = guildId.trim();
  return ALLOWED_GUILD_ID_RE.test(trimmed) ? trimmed : null;
}

export function getGuildIdFromUrl(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url);
  return validateGuildId(searchParams.get("guild_id") ?? searchParams.get("guildId"));
}

export function getGuildIdFromRequestBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  return validateGuildId(
    typeof payload.guild_id === "string" ? payload.guild_id : typeof payload.guildId === "string" ? payload.guildId : null
  );
}

export async function verifyGuildAccess(accessToken: string, guildId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) {
        if (res.status === 429 && attempt === 0) {
          const retryAfter = res.headers.get("Retry-After");
          const delay = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 1000) : 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        return false;
      }

      const guilds = (await res.json()) as Array<{ id: string; owner?: boolean; permissions?: number | string }>;
      const guild = guilds.find((g) => g.id === guildId);
      if (!guild) return false;

      const perms = typeof guild.permissions === "string" ? parseInt(guild.permissions, 10) : guild.permissions || 0;
      return Boolean(guild.owner || (perms & 0x8) !== 0 || (perms & 0x20) !== 0);
    } catch (error) {
      if (attempt === 1) {
        console.error("[dashboard-auth] verifyGuildAccess failed:", error);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return false;
}
