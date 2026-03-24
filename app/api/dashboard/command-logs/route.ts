import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily to avoid errors during build
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    return null; // Return null instead of throwing
  }
  
  return createClient(url, key);
}

// Verify bypass token
function verifyBypassToken(token: string): boolean {
  // Accept either DASHBOARD_BYPASS_TOKEN or ENTERPRISE_API_TOKEN
  const dashboardToken = process.env.DASHBOARD_BYPASS_TOKEN;
  const enterpriseToken = process.env.ENTERPRISE_API_TOKEN;
  
  if (!token) return false;
  
  // Check both tokens
  if (dashboardToken && token === dashboardToken) return true;
  if (enterpriseToken && token === enterpriseToken) return true;
  
  return false;
}

// POST: Log a command execution
export async function POST(request: NextRequest) {
  try {
    const bypassToken = request.headers.get('X-Dashboard-Bypass-Token');
    
    if (!verifyBypassToken(bypassToken || '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { guild_id, user_id, command_name, status, details } = body;

    if (!guild_id || !user_id || !command_name || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: guild_id, user_id, command_name, status' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    // Insert command log into database
    const { data, error } = await supabase
      .from('command_logs')
      .insert({
        guild_id,
        user_id,
        command_name,
        status,
        details: details || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to log command' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Retrieve command logs (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const bypassToken = request.headers.get('X-Dashboard-Bypass-Token');
    
    if (!verifyBypassToken(bypassToken || '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      // Supabase not configured - return empty logs instead of 503
      // This allows the dashboard to function without command logging
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          limit: 0,
          offset: 0,
          total: 0,
        },
        note: 'Command logging not configured',
      });
    }

    const { searchParams } = new URL(request.url);
    const guild_id = searchParams.get('guild_id');
    const user_id = searchParams.get('user_id');
    const command_name = searchParams.get('command_name');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('command_logs')
      .select('*', { count: 'exact' });

    if (guild_id) {
      query = query.eq('guild_id', guild_id);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (command_name) {
      query = query.eq('command_name', command_name);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch command logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('GET /command-logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
