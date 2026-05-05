'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const BASE_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1482902329148838059&permissions=268823649&integration_type=0&scope=bot';

function InviteContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams?.get('guild_id');

  useEffect(() => {
    const inviteUrl = guildId
      ? `${BASE_INVITE_URL}&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true`
      : BASE_INVITE_URL;
    window.location.replace(inviteUrl);
  }, [guildId]);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="animate-pulse text-center p-6 bg-white/5 rounded-xl border border-white/10 space-y-3">
        <div className="h-4 rounded bg-white/10 w-56 mx-auto" />
        <div className="h-4 rounded bg-white/10 w-44 mx-auto" />
        <div className="h-4 rounded bg-white/10 w-32 mx-auto" />
      </div>
      <p className="text-white/60 text-sm">Redirecting you to the bot invite...</p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="animate-pulse text-center p-6 bg-white/5 rounded-xl border border-white/10 space-y-3">
            <div className="h-4 rounded bg-white/10 w-56 mx-auto" />
            <div className="h-4 rounded bg-white/10 w-44 mx-auto" />
            <div className="h-4 rounded bg-white/10 w-32 mx-auto" />
          </div>
          <p className="text-white/60 text-sm">Redirecting you to the bot invite...</p>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
