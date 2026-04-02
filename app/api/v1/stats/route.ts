// app/api/v1/stats/route.ts
/**
 * Public Stats API Endpoint
 * GET /api/v1/stats
 *
 * Returns cached bot statistics.
 * No authentication required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Cache for 30 minutes
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
let cachedData: { users: number; guilds: number; last_updated: number } | null = null;
let cacheTimestamp: number = 0;

function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchStatsFromSupabase() {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from('bot_stats')
    .select('users, guilds, last_updated')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching bot stats:', error);
    throw new Error('Failed to fetch stats');
  }

  return data;
}

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();

    // Check if we have valid cached data
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    // Fetch fresh data from Supabase
    const data = await fetchStatsFromSupabase();

    // Update cache
    cachedData = data;
    cacheTimestamp = now;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Stats API error:', error);

    // If we have stale cache data, return it as fallback
    if (cachedData) {
      console.log('Returning stale cache data due to error');
      return NextResponse.json(cachedData);
    }

    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}