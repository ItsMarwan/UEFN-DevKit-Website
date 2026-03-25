import { useEffect, useState, useRef } from 'react';

export interface BotHealthStatus {
  status: 'online' | 'offline' | 'checking';
  lastChecked: Date | null;
  connectionTime: number | null;
  checkHealth?: () => Promise<void>;
}

/**
 * Hook to monitor bot health/connection status
 * Performs single initial health check on load, no periodic checks
 * Call the returned checkHealth function manually to re-check
 * @param onConnectionSuccess - Optional callback fired when connection is successful
 */
export function useBotHealth(onConnectionSuccess?: () => void) {
  const [health, setHealth] = useState<BotHealthStatus>({
    status: 'checking',
    lastChecked: null,
    connectionTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;
    const startTime = performance.now();

    try {
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const connectionTime = Math.round(endTime - startTime);

      if (response.ok) {
        setHealth({
          status: 'online',
          lastChecked: new Date(),
          connectionTime,
        });
        onConnectionSuccess?.();
      } else {
        setHealth({
          status: 'offline',
          lastChecked: new Date(),
          connectionTime: null,
        });
      }
    } catch (error) {
      // Only set offline if it wasn't aborted (user navigated away)
      if (error instanceof Error && error.name !== 'AbortError') {
        setHealth({
          status: 'offline',
          lastChecked: new Date(),
          connectionTime: null,
        });
      }
    }
  };

  useEffect(() => {
    // Perform initial health check
    checkHealth();

    // Set up periodic health checks
    const setupInterval = () => {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set interval based on current status
      // When offline: retry every 10 seconds
      // When online: check every 30 seconds
      const interval = health.status === 'offline' ? 10000 : 30000;

      intervalRef.current = setInterval(() => {
        checkHealth();
      }, interval);
    };

    // Setup interval after initial check completes
    const timeoutId = setTimeout(setupInterval, 100);

    return () => {
      // Cleanup: abort pending request and clear intervals
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [health.status]);

  return { ...health, checkHealth };
}
