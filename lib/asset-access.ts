import crypto from 'crypto';

const DISCORD_API = 'https://discord.com/api/v10';
const FLASK_API_URL = process.env.FLASK_API_URL;
const ENTERPRISE_API_TOKEN = process.env.ENTERPRISE_API_TOKEN;
const ENTERPRISE_ORIGIN = process.env.ENTERPRISE_API_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

function isValidGuildId(guildId: unknown): guildId is string {
  return typeof guildId === 'string' && /^\d{17,19}$/.test(guildId);
}

function generateAuthHeader(secret: string, bodyStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${bodyStr}`);
  return `Bearer ${timestamp}.${hmac.digest('hex')}`;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10000) {
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

function buildDiscordIconUrl(guildId: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=512`;
}

function parseBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === undefined || value === null) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(normalized);
  }
  return false;
}

function isHostableWebAsset(raw: Record<string, unknown>): boolean {
  return raw?.asset_type === 'web'
    && parseBoolean(raw?.enabled)
    && parseBoolean(raw?.storage_enabled)
    && typeof raw?.storage_url === 'string'
    && raw.storage_url.startsWith('storage://');
}

function isDiscoverableWebAsset(raw: Record<string, unknown>): boolean {
  if (raw?.asset_type !== 'web') return false;
  if (!parseBoolean(raw?.enabled)) return false;
  if (typeof raw?.storage_url !== 'string' || !raw.storage_url.trim()) return false;
  const discoverableValue = raw?.discoverable;
  const discoverable = discoverableValue == null ? true : parseBoolean(discoverableValue);
  return discoverable;
}

function isDiscoverableAsset(raw: Record<string, unknown>): boolean {
  if (!parseBoolean(raw?.enabled)) return false;

  const discoverableValue = raw?.discoverable;
  const discoverable = discoverableValue == null ? true : parseBoolean(discoverableValue);
  if (!discoverable) return false;

  const assetType = String(raw?.asset_type ?? 'web');
  if (assetType === 'web') {
    return typeof raw?.storage_url === 'string' && raw.storage_url.trim() !== '';
  }

  if (assetType === 'full' || assetType === 'semi') {
    return typeof raw?.required_role_id === 'string' && raw.required_role_id.trim() !== '';
  }

  return false;
}

function isVisibleAsset(raw: Record<string, unknown>): boolean {
  if (!parseBoolean(raw?.enabled)) return false;

  const assetType = String(raw?.asset_type ?? 'web');
  if (assetType === 'web') {
    return typeof raw?.storage_url === 'string' && raw.storage_url.trim() !== '';
  }

  return typeof raw?.required_role_id === 'string' && raw.required_role_id.trim() !== '';
}

function normalizePublicAsset(raw: Record<string, unknown>) {
  const assetType = String(raw.asset_type ?? 'web') as 'full' | 'semi' | 'web';
  const enabled = parseBoolean(raw.enabled);
  const storageEnabled = parseBoolean(raw.storage_enabled);
  const discoverableValue = raw?.discoverable;
  const discoverable = discoverableValue == null ? true : parseBoolean(discoverableValue);
  const publicAsset = {
    asset_id: String(raw.asset_id ?? raw.id ?? ''),
    guild_id: String(raw.guild_id ?? raw.guildId ?? ''),
    name: typeof raw.name === 'string' ? raw.name : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    asset_type: assetType,
    required_hours: typeof raw.required_hours === 'number' ? raw.required_hours : 0,
    required_role_id: typeof raw.required_role_id === 'string' && raw.required_role_id.trim() ? raw.required_role_id.trim() : undefined,
    required_role_name: undefined as string | undefined,
    enabled,
    storage_enabled: storageEnabled,
    download_count: typeof raw.download_count === 'number' ? raw.download_count : undefined,
    info_channel_configured: Boolean(raw.info_channel_id),
    discoverable,
    storage_url: typeof raw.storage_url === 'string' ? String(raw.storage_url) : undefined,
  };
  return publicAsset;
}

function unwrapResponseBody(json: any): any {
  if (json?.data?.data?.data !== undefined) return json.data.data.data;
  if (json?.data?.data !== undefined) return json.data.data;
  if (json?.data !== undefined) return json.data;
  return json;
}

async function fetchFlaskGuildSettings(guildId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) {
    throw new Error('Flask API is not configured');
  }

  const body = { endpoint: 'guild_settings', method: 'GET', parameters: {} };
  const bodyStr = JSON.stringify(body);
  const res = await fetchWithTimeout(`${FLASK_API_URL}/api/v1/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr),
      'X-Discord-Server-ID': guildId,
      'X-Internal-API-Key': process.env.FLASK_INTERNAL_API_KEY || '',
      'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
      Origin: ENTERPRISE_ORIGIN,
    },
    body: bodyStr,
    cache: 'no-store',
  }, 10000);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch guild settings: ${res.status} ${res.statusText} ${errorText}`);
  }

  const json = await res.json();
  return unwrapResponseBody(json);
}

async function fetchFlaskAssets(guildId: string) {
  if (!FLASK_API_URL || !ENTERPRISE_API_TOKEN) {
    throw new Error('Flask API is not configured');
  }

  const body = { endpoint: 'guild_assets', method: 'GET', parameters: {} };
  const bodyStr = JSON.stringify(body);
  const res = await fetchWithTimeout(`${FLASK_API_URL}/api/v1/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: generateAuthHeader(ENTERPRISE_API_TOKEN, bodyStr),
      'X-Discord-Server-ID': guildId,
      'X-Internal-API-Key': process.env.FLASK_INTERNAL_API_KEY || '',
      'X-Dashboard-Bypass-Token': ENTERPRISE_API_TOKEN,
      Origin: ENTERPRISE_ORIGIN,
    },
    body: bodyStr,
    cache: 'no-store',
  }, 10000);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch assets: ${res.status} ${res.statusText} ${errorText}`);
  }

  const json = await res.json();
  const assets = json?.data?.data?.data ?? json?.data?.data ?? json?.data?.assets ?? json?.assets ?? [];
  return Array.isArray(assets) ? assets : [];
}

export async function getPublicGuildInfo(guildId: string) {
  if (!isValidGuildId(guildId)) {
    throw new Error('Invalid guild ID');
  }

  const info: { id: string; name: string; icon: string | null; iconUrl: string | null } = {
    id: guildId,
    name: 'Server',
    icon: null,
    iconUrl: null,
  };

  if (process.env.DISCORD_BOT_TOKEN) {
    try {
      const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        cache: 'no-store',
      });
      if (guildRes.ok) {
        const guildData = await guildRes.json();
        info.name = String(guildData.name ?? info.name);
        info.icon = guildData.icon ?? null;
        info.iconUrl = buildDiscordIconUrl(guildId, info.icon);
      }
    } catch {
      // Use fallback server name
    }
  }

  return info;
}

export async function getPublicDiscoverableAssets(guildId: string) {
  if (!isValidGuildId(guildId)) {
    throw new Error('Invalid guild ID');
  }

  const guild = await getPublicGuildInfo(guildId);
  if (!guild) {
    return null;
  }

  const guildSettings = await fetchFlaskGuildSettings(guildId);
  const assetAccessEnabled = parseBoolean(guildSettings?.enabled);
  if (!assetAccessEnabled) {
    return { guild, assets: [], assetAccessEnabled };
  }

  const assets = await fetchFlaskAssets(guildId);
  const publicAssets = Array.isArray(assets)
    ? (assets as Record<string, unknown>[])
        .filter((asset) => isDiscoverableAsset(asset))
        .map((asset) => normalizePublicAsset(asset))
    : [];

  return { guild, assets: publicAssets, assetAccessEnabled };
}

export async function getPublicAssetMetadata(guildId: string, assetId: string) {
  if (!isValidGuildId(guildId)) {
    throw new Error('Invalid guild ID');
  }
  if (!assetId) {
    throw new Error('Missing asset ID');
  }

  const guild = await getPublicGuildInfo(guildId);
  if (!guild) {
    return null;
  }

  const guildSettings = await fetchFlaskGuildSettings(guildId);
  const assetAccessEnabled = parseBoolean(guildSettings?.enabled);
  if (!assetAccessEnabled) {
    return null;
  }

  const assets = await fetchFlaskAssets(guildId);
  const raw = Array.isArray(assets)
    ? assets.find((item) => String((item as Record<string, unknown>).asset_id ?? (item as Record<string, unknown>).id) === assetId)
    : null;

  if (!raw || !isVisibleAsset(raw as Record<string, unknown>)) {
    return null;
  }

  const normalizedAsset = normalizePublicAsset(raw as Record<string, unknown>);
  return {
    guild,
    asset: normalizedAsset,
  };
}
