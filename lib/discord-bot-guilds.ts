/**
 * Discord Bot Guild Utilities
 * Handles fetching and caching bot guild information
 */

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

interface BotGuildCache {
  ids: Set<string>;
  fetchedAt: number;
}

// Module-level cache — refreshed every 5 minutes
let botGuildCache: BotGuildCache | null = null;
const BOT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches all guilds the bot is a member of from Discord API
 * Uses pagination to handle 200+ guilds
 * @returns Set of guild IDs or null if fetch fails
 */
export async function fetchBotGuildIds(): Promise<Set<string> | null> {
  if (!BOT_TOKEN) {
    console.error('DISCORD_BOT_TOKEN not set in environment');
    return null;
  }

  const now = Date.now();

  // Return cached result if fresh
  if (botGuildCache && now - botGuildCache.fetchedAt < BOT_CACHE_TTL_MS) {
    return botGuildCache.ids;
  }

  try {
    const allIds = new Set<string>();
    let after: string | undefined;

    // Paginate through all bot guilds (200 per page)
    while (true) {
      const url = new URL(`${DISCORD_API}/users/@me/guilds`);
      url.searchParams.set('limit', '200');
      if (after) url.searchParams.set('after', after);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error(`Failed to fetch bot guilds: ${res.status} ${res.statusText}`);
        break;
      }

      const page: Array<{ id: string }> = await res.json();
      if (page.length === 0) break;

      page.forEach((g) => allIds.add(g.id));

      if (page.length < 200) break; // Last page
      after = page[page.length - 1].id;
    }

    // Cache the result
    botGuildCache = { ids: allIds, fetchedAt: now };
    return allIds;
  } catch (e) {
    console.error('Error fetching bot guild IDs:', e);
    // Return stale cache if available
    return botGuildCache?.ids ?? null;
  }
}

/**
 * Checks if the bot is in a specific guild
 * @param guildId The Discord guild ID
 * @returns true if bot is in the guild, false otherwise
 */
export async function isBotInGuild(guildId: string): Promise<boolean> {
  const botGuildIds = await fetchBotGuildIds();
  if (!botGuildIds) return false; // Conservative: assume not in guild if we can't check
  return botGuildIds.has(guildId);
}

/**
 * Clears the bot guild cache
 * Useful for testing or forcing a refresh
 */
export function clearBotGuildCache(): void {
  botGuildCache = null;
}

/**
 * Gets the current cache status
 */
export function getBotGuildCacheStatus(): { cached: boolean; age: number } {
  if (!botGuildCache) {
    return { cached: false, age: 0 };
  }
  return { cached: true, age: Date.now() - botGuildCache.fetchedAt };
}
