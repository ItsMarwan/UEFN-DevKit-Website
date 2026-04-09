'use client';

/**
 * useRateLimiter
 *
 * Provides:
 *  - checkApi(fn)  — wraps any fetch/async call with the API rate limiter
 *  - checkPage(fn) — wraps any navigation with the page rate limiter
 *
 * On page-block:
 *  - Shows a toast (uses the ToastProvider already in the app)
 *  - Overlays a transparent div that absorbs all mouse events except scroll
 *
 * On API-block:
 *  - Returns false so the caller knows not to proceed
 *  - Optionally shows a toast (pass showApiToast: true)
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  configureApiLimiter,
  configurePageLimiter,
  checkApiRateLimit,
  checkPageRateLimit,
} from '@/lib/rate-limiter';
import { useToast } from '@/components/ToastProvider';

interface UseRateLimiterOptions {
  /** Show a toast when the API is rate-limited (default: false) */
  showApiToast?: boolean;
}

export function useRateLimiter(opts: UseRateLimiterOptions = {}) {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const unblockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Input-lock overlay ─────────────────────────────────────────────────────

  const lockInput = useCallback((durationMs: number) => {
    if (overlayRef.current) return; // already locked

    const overlay = document.createElement('div');
    overlay.id = '__rl_overlay__';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      cursor: 'not-allowed',
      // Let wheel events fall through (scroll still works)
      pointerEvents: 'all',
    } as CSSStyleDeclaration);

    // Block clicks, mousedown, mouseup, contextmenu — but NOT wheel / scroll
    const block = (e: Event) => e.preventDefault();
    overlay.addEventListener('click', block, { capture: true });
    overlay.addEventListener('mousedown', block, { capture: true });
    overlay.addEventListener('mouseup', block, { capture: true });
    overlay.addEventListener('contextmenu', block, { capture: true });
    overlay.addEventListener('keydown', block, { capture: true });
    overlay.addEventListener('touchstart', block, { capture: true, passive: false });
    overlay.addEventListener('touchmove', block, { capture: true, passive: false });

    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Auto-release
    if (unblockTimerRef.current) clearTimeout(unblockTimerRef.current);
    unblockTimerRef.current = setTimeout(() => {
      unlockInput();
    }, durationMs + 100); // tiny buffer
  }, []);

  const unlockInput = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
    if (unblockTimerRef.current) {
      clearTimeout(unblockTimerRef.current);
      unblockTimerRef.current = null;
    }
  }, []);

  // ── Wire limiter callbacks once ────────────────────────────────────────────

  useEffect(() => {
    const pageDurationMs = 5_000;

    configurePageLimiter({
      onBlock: () => {
        const secs = Math.ceil(pageDurationMs / 1000);
        showToast(
          'error',
          'Rate Limited',
          `You are navigating too fast. Please slow down — blocked for ${secs}s.`,
          pageDurationMs
        );
        lockInput(pageDurationMs);
      },
      onUnblock: () => {
        unlockInput();
      },
    });

    if (opts.showApiToast) {
      const apiDurationMs = 10_000;
      configureApiLimiter({
        onBlock: () => {
          const secs = Math.ceil(apiDurationMs / 1000);
          showToast(
            'error',
            'API Rate Limited',
            `Too many requests — please wait ${secs}s before trying again.`,
            apiDurationMs
          );
        },
      });
    }

    return () => {
      unlockInput();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public helpers ─────────────────────────────────────────────────────────

  /**
   * Wrap any async API call. Returns the result of fn(), or null if blocked.
   *
   * @example
   * const data = await checkApi(() => fetch('/api/foo').then(r => r.json()));
   */
  const checkApi = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      const result = checkApiRateLimit();
      if (!result.allowed) return null;
      return fn();
    },
    []
  );

  /**
   * Wrap any navigation/action. Returns false and blocks if rate-limited.
   *
   * @example
   * const ok = checkPage(() => router.push('/other'));
   * if (!ok) return; // blocked
   */
  const checkPage = useCallback(
    (fn?: () => void): boolean => {
      const result = checkPageRateLimit();
      if (!result.allowed) return false;
      fn?.();
      return true;
    },
    []
  );

  return { checkApi, checkPage };
}
