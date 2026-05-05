'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const BASE_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1482902329148838059&permissions=268823649&integration_type=0&scope=bot';
const REDIRECT_DELAY = 2200; // 2.2 seconds delay

function InviteContent() {
  const searchParams = useSearchParams();
  const guildId = searchParams?.get('guild_id');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Handle the progress bar animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / REDIRECT_DELAY) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= REDIRECT_DELAY) {
        clearInterval(interval);
        const inviteUrl = guildId
          ? `${BASE_INVITE_URL}&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true`
          : BASE_INVITE_URL;
        window.location.replace(inviteUrl);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [guildId]);

  return (
    <div className="text-white min-h-screen flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="max-w-sm w-full flex flex-col items-center">
        {/* Bot Identity Card */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all duration-1000" />
          <div className="relative bg-neutral-900 border border-white/10 p-1 rounded-full shadow-2xl">
            {/* Using standard img tag to bypass next/image domain whitelist requirement */}
            <img 
              src="/images/logo.png" 
              alt="Bot Logo" 
              width={100} 
              height={100} 
              className="rounded-full"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2 tracking-tight text-white">Preparing the Bot</h1>
        <p className="text-neutral-400 text-sm text-center mb-10 max-w-[280px]">
          Linking with Discord to get your workspace ready.
        </p>

        {/* Progress System */}
        <div className="w-full space-y-4">
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-blue-500 transition-all duration-75 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-1">
            <span>Generating Token</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-2 text-neutral-500 animate-pulse">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-xs font-medium">Safe Redirect Active</span>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}