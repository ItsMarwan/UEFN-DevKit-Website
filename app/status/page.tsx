'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type ServiceStatus = 'checking' | 'online' | 'offline';

export default function StatusPage() {
  const [serverStatus, setServerStatus] = useState<ServiceStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setServerStatus('checking');
    try {
      // Pinging the proxy endpoint which checks the actual server/bot
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'online': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'offline': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      case 'checking': return 'bg-yellow-500 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'online': return 'Operational';
      case 'offline': return 'Major Outage';
      case 'checking': return 'Checking...';
    }
  };

  const isAllSystemsOperational = serverStatus === 'online';

  return (
    <div className="min-h-screen text-white selection:bg-blue-500/30 flex flex-col items-center py-20 px-4 md:px-8">
      {/* Background glow based on overall status */}
      <div 
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-[150px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${
          serverStatus === 'checking' ? 'bg-yellow-500/10' :
          serverStatus === 'online' ? 'bg-emerald-500/10' : 'bg-red-500/10'
        }`} 
      />

      <div className="max-w-3xl w-full">
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors mb-8">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">System Status</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-neutral-900/50 border border-neutral-800 rounded-full px-4 py-2 w-fit">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(isAllSystemsOperational ? 'online' : serverStatus)}`} />
              <span className="text-sm font-medium">
                {serverStatus === 'checking' ? 'Checking Systems...' : 
                 isAllSystemsOperational ? 'All Systems Operational' : 'Some Systems Experiencing Issues'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-neutral-500">
              {lastChecked && (
                <span>Last updated: {lastChecked.toLocaleTimeString()}</span>
              )}
              <button 
                onClick={checkHealth}
                disabled={serverStatus === 'checking'}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Status"
              >
                <svg className={`w-4 h-4 ${serverStatus === 'checking' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {/* Website / Frontend - Always Operational if they are seeing this */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-neutral-900/50">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Website & Dashboard</h3>
              <p className="text-sm text-neutral-400">Next.js frontend infrastructure</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-medium text-sm tracking-wide uppercase">Operational</span>
            </div>
          </div>

          {/* Bot & Server API - Checked dynamically */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-neutral-900/50">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Core Server & Bot</h3>
              <p className="text-sm text-neutral-400">Backend API, Discord Bot, and Task Processors</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-medium text-sm tracking-wide uppercase ${
                serverStatus === 'online' ? 'text-emerald-400' : 
                serverStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {getStatusText(serverStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Informational Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-neutral-500 text-sm">
            Updates to the system status are reflected here in real-time. 
            If you are experiencing issues while our systems report as operational, 
            please <Link href="/support" className="text-blue-400 hover:text-blue-300 transition-colors">contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}