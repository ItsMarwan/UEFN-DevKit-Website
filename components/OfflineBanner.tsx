import { useEffect, useState, useRef } from 'react';
import { useToast } from './ToastProvider';
import type { BotHealthStatus } from '@/hooks/useBotHealth';

interface OfflineBannerProps {
  health: BotHealthStatus;
}

/**
 * OfflineBanner - Displays connection status banner for dashboard pages
 * Only shows when server connection is lost (offline status)
 * Never appears on initial page load - only on connection loss
 */
export function OfflineBanner({ health }: OfflineBannerProps) {
  const { showToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [wasPreviouslyOnline, setWasPreviouslyOnline] = useState(true);
  const hasLoadedRef = useRef(false);

  // Only show banner if we transition to offline after initial load
  useEffect(() => {
    // Mark that we've loaded after first status check
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setWasPreviouslyOnline(health.status === 'online');
      return;
    }

    // Only show banner if we transition FROM online TO offline (not if already offline)
    if (health.status === 'offline' && wasPreviouslyOnline && !isVisible) {
      setIsVisible(true);
      setIsClosing(false);
      setWasPreviouslyOnline(false);
    }

    // Show reconnection toast when coming back online
    if (health.status === 'online' && isVisible) {
      showToast('success', 'Reconnected', 'Successfully reconnected with the bot!');
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => setIsVisible(false), 500);
      }, 3000);
      setWasPreviouslyOnline(true);
      return () => clearTimeout(timer);
    }

    // Update previous online state
    if (health.status === 'online') {
      setWasPreviouslyOnline(true);
    }
  }, [health.status, isVisible, wasPreviouslyOnline, showToast]);

  if (!isVisible) {
    return null;
  }

  const statusMessage = 'Bot connection lost';
  const statusDescription = 'Attempting to reconnect...';

  return (
    <>
      {/* Status Banner */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isClosing ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="w-full px-4 py-4 border-b-2 bg-red-600/95 border-red-700">
          <div className="max-w-7xl mx-auto flex items-center gap-3 justify-between">
            {/* Left: Status indicator and message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{statusMessage}</p>
                <p className="text-xs text-white/80 mt-0.5">{statusDescription}</p>
              </div>
            </div>

            {/* Right: Close button */}
            <button
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => setIsVisible(false), 500);
              }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-white"
              aria-label="Close status banner"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
