'use client';

import { useBotHealth } from '@/hooks/useBotHealth';
import { StatusIndicator } from './StatusIndicator';

/**
 * LayoutWrapper - Root layout component
 * Provides status indicator (dot) visible on all pages
 * Wraps Navigation and main content
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const botHealth = useBotHealth();

  return (
    <>
      <StatusIndicator health={botHealth} />
      {children}
    </>
  );
}
