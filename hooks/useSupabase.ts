/**
 * Supabase hook for user operations
 *
 * Changes from original:
 * - Removed getToken() — auth_token is now httpOnly and unreadable from JS.
 *   The browser sends it automatically on same-origin requests.
 * - All fetches now use NEXT_PUBLIC_DASHBOARD_API_TOKEN which is the only
 *   token the /api/v1/supabase route validates against.
 * - getUserStats() return shape now includes managed_guild_ids so the
 *   dashboard can reconstruct the guild list on a hard refresh.
 */

'use client';

import { useCallback } from 'react';

interface UserData {
  discord_id: string;
  discord_username: string;
  discord_email: string;
  discord_avatar_url: string;
  managed_guild_ids: string[];
}

function getDashboardToken(): string {
  const token = process.env.NEXT_PUBLIC_DASHBOARD_API_TOKEN;
  if (!token) throw new Error('Missing NEXT_PUBLIC_DASHBOARD_API_TOKEN');
  return token;
}

async function supabaseFetch(body: object): Promise<Response> {
  return fetch('/api/v1/supabase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getDashboardToken()}`,
    },
    body: JSON.stringify(body),
  });
}

export function useSupabase() {
  const loginUser = useCallback(
    async (userData: Omit<UserData, 'discord_id'> & { discord_id?: string }) => {
      const response = await supabaseFetch({
        operation: 'upsert_user',
        discord_id: userData.discord_id,
        data: userData,
      });
      if (!response.ok) throw new Error('Failed to upsert user');
      return response.json();
    },
    []
  );

  const getUser = useCallback(async (userId: string) => {
    const response = await supabaseFetch({
      operation: 'get_user',
      discord_id: userId,
    });
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  }, []);

  /** Returns full user row including managed_guild_ids */
  const getUserStats = useCallback(async (userId: string) => {
    const response = await supabaseFetch({
      operation: 'get_user_stats',
      discord_id: userId,
    });
    if (!response.ok) throw new Error('Failed to get user stats');
    return response.json();
  }, []);

  const getUserGuilds = useCallback(async (userId: string) => {
    const response = await supabaseFetch({
      operation: 'get_user_guilds',
      discord_id: userId,
    });
    if (!response.ok) throw new Error('Failed to get user guilds');
    return response.json();
  }, []);

  return { loginUser, getUser, getUserStats, getUserGuilds };
}