'use client';

import { useState } from 'react';
import type { BotHealthStatus } from '@/hooks/useBotHealth';

interface StatusIndicatorProps {
  health: BotHealthStatus;
}

/**
 * StatusIndicator - Persistent status dot in bottom-right corner
 * Shows connection status with detailed tooltip on hover
 * Visible on all pages throughout the app
 */
export function StatusIndicator({ health }: StatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isOnline = health.status === 'online';
  const connectionTimeMs = health.connectionTime;

  // Build tooltip content based on status
  let statusMessage = '';
  let statusIcon = '';

  if (isOnline) {
    statusMessage = 'Connected to server';
    statusIcon = '✓';
    if (connectionTimeMs) {
      statusMessage += ` (${connectionTimeMs}ms)`;
    }
  } else if (health.status === 'checking') {
    statusMessage = 'Checking connection...';
    statusIcon = '⟳';
  } else {
    statusMessage = 'Couldn\'t connect to the API server';
    statusIcon = '✕';
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="status"
      aria-label={statusMessage}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-lg text-white text-xs whitespace-nowrap animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm">{statusIcon}</span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Status Indicator Dot */}
      <button
        type="button"
        className={`w-4 h-4 rounded-full transition-all cursor-pointer ring-2 ring-transparent hover:ring-white/20 ${
          isOnline ? 'bg-green-500 animate-pulse' : health.status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-bounce'
        }`}
        aria-pressed="false"
        aria-label={`Server status: ${health.status}`}
      />
    </div>
  );
}
