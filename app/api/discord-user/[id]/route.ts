import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const apiUrl = process.env.DISCORD_USER_API_URL;

    if (!apiUrl) {
      return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }

    // CORS check - only allow requests from the website
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedOrigins = [
      'https://uefndevkit.rweb.site',
      'http://localhost:3000',
      process.env.NODE_ENV === 'production' ? 'https://uefndevkit.rweb.site' : null
    ].filter(Boolean);

    const isAllowed = origin && allowedOrigins.includes(origin);
    const isRefererAllowed = referer && allowedOrigins.some(allowed => referer.startsWith(allowed));

    if (!isAllowed && !isRefererAllowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const response = await fetch(`${apiUrl}?user=${userId}`);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }

    const user = await response.json();

    const result = NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.displayName || user.tag || user.username,
      avatar: user.avatar?.link || null,
    });

    // Set CORS headers
    result.headers.set('Access-Control-Allow-Origin', origin || '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return result;
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}