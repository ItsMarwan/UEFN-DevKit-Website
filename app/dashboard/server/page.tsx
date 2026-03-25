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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  );
}
