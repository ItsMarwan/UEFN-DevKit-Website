'use client';

import { useEffect } from 'react';

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1482902329148838059&permissions=268823649&integration_type=0&scope=bot';
export default function InvitePage() {
  useEffect(() => {
    window.location.replace(INVITE_URL);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Redirecting you to the bot invite...</p>
    </div>
  );
}
