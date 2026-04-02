// Proxy /auth/patreon/callback from Patreon to Flask and redirect to UI
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    const errRedirect = APP_URL ? `${APP_URL}/patreon?patreon_auth=error` : '/patreon?patreon_auth=error';
    return NextResponse.redirect(errRedirect);
  }

  const flaskRes = await fetch(
    `${FLASK_API_URL}/auth/patreon/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { method: 'GET' }
  );

  let result = { authenticated: false };
  try {
    result = await flaskRes.json();
  } catch {
    // keep default unexplained failure
  }

  const status = result.authenticated ? 'success' : 'error';
  const redirectUrl = APP_URL ? `${APP_URL}/patreon?patreon_auth=${status}` : `/patreon?patreon_auth=${status}`;

  return NextResponse.redirect(redirectUrl);
}
