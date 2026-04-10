'use client';

/**
 * RateLimitProvider
 *
 * Mount this once inside your root layout (inside ToastProvider).
 * It activates both limiters globally so every fetch and every Link click
 * is automatically guarded without needing to wrap individual call-sites.
 *
 * Monkey-patches:
 *  - window.fetch          → api limiter
 *  - Next.js router.push / router.replace → page limiter
 *  - history.pushState / replaceState    → page limiter
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  configureApiLimiter,
  configurePageLimiter,
  checkApiRateLimit,
  checkPageRateLimit,
} from '@/lib/rate-limiter';
import { useToast } from '@/components/ToastProvider';

const API_BLOCK_MS = 5_000;
const PAGE_BLOCK_MS = 5_000;

/** Paths/origins to skip rate-limiting (e.g. internal Next.js dev calls) */
const SKIP_API_PATTERNS: (string | RegExp)[] = [
  '/_next/',
  '/favicon.ico',
];

function shouldSkipUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url, window.location.origin);
  } catch {
    return false;
  }

  // Only enforce rate limiting for same-origin app requests.
  // Ignore third-party fetches and internal Next.js asset/data calls.
  if (parsedUrl.origin !== window.location.origin) {
    return true;
  }

  return SKIP_API_PATTERNS.some((p) =>
    typeof p === 'string' ? parsedUrl.pathname.includes(p) : p.test(parsedUrl.pathname)
  );
}

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalFetch = useRef<typeof fetch | null>(null);
  const originalPushState = useRef<typeof history.pushState | null>(null);
  const originalReplaceState = useRef<typeof history.replaceState | null>(null);

  // ── Overlay helpers ────────────────────────────────────────────────────────

  const lockInput = useCallback((durationMs: number) => {
    if (overlayRef.current) return; // already locked

    const el = document.createElement('div');
    el.id = '__rl_lock__';
    Object.assign(el.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      cursor: 'not-allowed',
      pointerEvents: 'all',
    } as Partial<CSSStyleDeclaration>);

    // Absorb all mouse/touch/keyboard except wheel (preserves scrolling)
    const absorb = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    ['click', 'mousedown', 'mouseup', 'contextmenu', 'keydown', 'touchstart', 'touchmove'].forEach(
      (ev) => el.addEventListener(ev, absorb, { capture: true, passive: false } as AddEventListenerOptions)
    );

    document.body.appendChild(el);
    overlayRef.current = el;

    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(unlockInput, durationMs + 150);
  }, []);

  const unlockInput = useCallback(() => {
    overlayRef.current?.remove();
    overlayRef.current = null;
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, []);

  // ── Initialise limiters with callbacks ────────────────────────────────────

  useEffect(() => {
    configureApiLimiter({
      onBlock: () => {
        const secs = Math.ceil(API_BLOCK_MS / 1000);
        showToast(
          'error',
          'API Rate Limited',
          `Too many requests — blocked for ${secs}s. Please slow down.`,
          API_BLOCK_MS
        );
      },
    });

    configurePageLimiter({
      onBlock: () => {
        const secs = Math.ceil(PAGE_BLOCK_MS / 1000);
        showToast(
          'error',
          'Rate Limited',
          `You are navigating too fast — blocked for ${secs}s. Please slow down.`,
          PAGE_BLOCK_MS
        );
        lockInput(PAGE_BLOCK_MS);
      },
      onUnblock: unlockInput,
    });
  }, [showToast, lockInput, unlockInput]);

  // ── Patch window.fetch ─────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const native = window.fetch.bind(window);
    originalFetch.current = native;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      // Skip internal Next.js / static assets
      if (shouldSkipUrl(url)) {
        return native(input, init);
      }

      const result = checkApiRateLimit();
      if (!result.allowed) {
        // Return a synthetic 429 response — does NOT modify the URL
        return new Response(
          JSON.stringify({
            error: 'rate_limited',
            message: 'Client-side rate limit exceeded.',
            retryAfter: Math.ceil(result.remainingMs / 1000),
          }),
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(result.remainingMs / 1000)),
            },
          }
        );
      }

      return native(input, init);
    };

    return () => {
      if (originalFetch.current) window.fetch = originalFetch.current;
    };
  }, []);

  // ── Patch history.pushState / replaceState ─────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nativePush = history.pushState.bind(history);
    const nativeReplace = history.replaceState.bind(history);
    originalPushState.current = nativePush;
    originalReplaceState.current = nativeReplace;

    function guardNavigation(
      native: typeof history.pushState,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      // Allow Next.js internal scroll-restoration calls (data.__NA)
      const isInternal =
        data && typeof data === 'object' && '__NA' in (data as object);

      if (!isInternal) {
        const result = checkPageRateLimit();
        if (!result.allowed) {
          // Silently swallow the navigation — no URL change
          return;
        }
      }

      native(data, unused, url);
    }

    history.pushState = function (...args) {
      guardNavigation(nativePush, ...args);
    };

    history.replaceState = function (...args) {
      // replaceState is used heavily by Next.js internals — skip limiting it
      nativeReplace(...args);
    };

    return () => {
      if (originalPushState.current) history.pushState = originalPushState.current;
      if (originalReplaceState.current) history.replaceState = originalReplaceState.current;
    };
  }, []);

  return <>{children}</>;
}
