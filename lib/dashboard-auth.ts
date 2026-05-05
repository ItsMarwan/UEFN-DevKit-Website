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
  return (
    validateGuildId(searchParams.get("guild_id") ?? searchParams.get("guildId")) ??
    validateGuildId(req.headers.get("X-Discord-Server-ID"))
  );
}

export function getGuildIdFromRequestBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  return validateGuildId(
    typeof payload.guild_id === "string"
      ? payload.guild_id
      : typeof payload.guildId === "string"
      ? payload.guildId
      : null
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

      const guilds = (await res.json()) as Array<{
        id: string;
        owner?: boolean;
        permissions?: number | string;
      }>;
      const guild = guilds.find((g) => g.id === guildId);
      if (!guild) return false;

      const perms =
        typeof guild.permissions === "string"
          ? parseInt(guild.permissions, 10)
          : guild.permissions || 0;
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

export function checkApiKey(req: NextRequest): null | string {
  const enterpriseToken = process.env.ENTERPRISE_API_TOKEN;

  if (!enterpriseToken) {
    return "ENTERPRISE_API_TOKEN is not set in environment variables";
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader) {
    return "No Authorization header provided";
  }

  if (!authHeader.startsWith("Bearer ")) {
    return `Authorization header must start with 'Bearer ' (got: '${authHeader.slice(0, 20)}...')`;
  }

  const token = authHeader.slice(7).trim();

  if (token.length === 0) {
    return "Bearer token is empty";
  }

  if (token.length !== enterpriseToken.length) {
    return `Token length mismatch: got ${token.length} chars, expected ${enterpriseToken.length} chars`;
  }

  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ enterpriseToken.charCodeAt(i);
  }

  if (diff !== 0) {
    return `Token value does not match ENTERPRISE_API_TOKEN (first 4 chars sent: '${token.slice(0, 4)}', expected: '${enterpriseToken.slice(0, 4)}')`;
  }

  return null;
}

export function isApiKeyRequest(req: NextRequest): boolean {
  return checkApiKey(req) === null;
}

export async function authenticateRequest(req: NextRequest): Promise<
  | { ok: true; guildId: string }
  | { ok: false; status: number; message: string }
> {
  const isDev = process.env.NODE_ENV !== "production";

  const guildId = getGuildIdFromUrl(req);
  if (!guildId) {
    const headerVal = req.headers.get("X-Discord-Server-ID");
    const reason = headerVal
      ? `X-Discord-Server-ID '${headerVal}' is not a valid Discord snowflake (17-20 digits)`
      : "guild_id not found in query string or X-Discord-Server-ID header";
    console.warn("[auth] guild_id missing:", reason);
    return { ok: false, status: 400, message: isDev ? reason : "Missing or invalid guild_id parameter" };
  }

  const apiKeyError = checkApiKey(req);

  if (apiKeyError === null) {
    return { ok: true, guildId };
  }

  const hasAuthHeader = !!(req.headers.get("Authorization"));
  if (hasAuthHeader) {
    console.warn("[auth] API key check failed");
    return {
      ok: false,
      status: 401,
      message: isDev ? "API key rejected" : "Unauthorized",
    };
  }

  const accessToken = getSessionToken(req);
  if (!accessToken) {
    const hasCookie = !!(req.cookies.get("dashboard_session")?.value);
    const reason = hasCookie
      ? "dashboard_session cookie is expired or malformed"
      : "No Authorization header and no dashboard_session cookie";
    console.warn("[auth] session missing:", reason);
    return {
      ok: false,
      status: 401,
      message: isDev ? reason : "Unauthorized",
    };
  }

  const hasAccess = await verifyGuildAccess(accessToken, guildId);
  if (!hasAccess) {
    const reason = `Discord OAuth token does not have manage permissions for guild ${guildId}`;
    console.warn("[auth] guild access denied:", reason);
    return {
      ok: false,
      status: 403,
      message: isDev ? reason : "Forbidden",
    };
  }

  return { ok: true, guildId };
}