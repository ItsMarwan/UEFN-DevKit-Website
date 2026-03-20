'use client';

import { useEffect } from 'react';

const INVITE_URL = '/'; // will keep it like this so i dont leak the bot early. still testing and making sure its ready for prod. also need other creators notes and stuff.

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