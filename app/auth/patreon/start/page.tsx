'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PatreonStartPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const serverId = searchParams.get('serverId');

  useEffect(() => {
    if (!plan || !serverId) {
      // Invalid params
      window.opener?.postMessage({
        type: 'PATREON_AUTH_ERROR',
        error: 'Invalid parameters'
      }, '*');
      window.close();
      return;
    }

    // Build Patreon OAuth URL
    const clientId = process.env.NEXT_PUBLIC_PATREON_CLIENT_ID || 'your_client_id';
    const fallbackRedirect = `${window.location.origin}/auth/patreon/callback`;
    const redirectUriRaw = process.env.NEXT_PUBLIC_PATREON_REDIRECT_URI || fallbackRedirect;
    const redirectUri = encodeURIComponent(redirectUriRaw);
    const scope = encodeURIComponent('identity identity[email]');
    const state = encodeURIComponent(JSON.stringify({ plan, serverId, redirectUri: redirectUriRaw }));

    const authUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    // Redirect to Patreon
    window.location.href = authUrl;
  }, [plan, serverId]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Redirecting to Patreon...</p>
      </div>
    </div>
  );
}