'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function ServerConfigPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get guildId from query params if available
    const id = searchParams.get('guildId');
    if (id) {
      setGuildId(id);
      setLoading(false);
    } else {
      // Try to fetch the first guild from session
      const fetchGuild = async () => {
        try {
          const res = await fetch('/api/dashboard/session');
          if (res.ok) {
            const data = await res.json();
            if (data.guilds && data.guilds.length > 0) {
              const firstGuildId = data.guilds[0].id;
              setGuildId(firstGuildId);
              // Redirect to the guild dashboard with config tab
              router.push(`/dashboard/${firstGuildId}?tab=config`);
            } else {
              setError('No guilds found. Please ensure the bot is in your server.');
              setLoading(false);
            }
          } else {
            setError('Failed to fetch session');
            setLoading(false);
          }
        } catch (err) {
          setError('An error occurred');
          setLoading(false);
        }
      };
      fetchGuild();
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Redirecting to configuration...</p>
      </div>
    </div>
  );
}

export default function ServerConfigPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <ServerConfigPageContent />
    </Suspense>
  );
}
