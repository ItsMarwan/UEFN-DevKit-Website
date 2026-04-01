'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ServerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to config tab
    router.push('/dashboard/server/config');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="animate-pulse max-w-md w-full text-center p-6 bg-black/40 rounded-xl border border-white/10">
        <div className="h-4 rounded bg-white/10 mb-3 mx-auto w-32" />
        <div className="h-4 rounded bg-white/10 mb-3 mx-auto w-40" />
        <div className="h-4 rounded bg-white/10 mx-auto w-20" />
        <p className="text-white/60 mt-4 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
