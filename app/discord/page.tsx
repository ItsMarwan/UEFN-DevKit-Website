'use client';

import { useEffect } from 'react';

const INVITE_URL = 'https://discord.gg/wfPfEw6b6w';

export default function InvitePage() {
  useEffect(() => {
    window.location.replace(INVITE_URL);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="animate-pulse text-center p-6 bg-white/5 rounded-xl border border-white/10 space-y-3">
        <div className="h-4 rounded bg-white/10 w-56 mx-auto" />
        <div className="h-4 rounded bg-white/10 w-44 mx-auto" />
        <div className="h-4 rounded bg-white/10 w-32 mx-auto" />
      </div>
      <p className="text-white/60 text-sm">Redirecting you to the discord server...</p>
    </div>
  );
}