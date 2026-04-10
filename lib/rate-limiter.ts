/**
 * Modular Client-Side Rate Limiter
 *
 * Two modes:
 *  - 'api'  : 5 requests per 2s window → 10s block on violation
 *  - 'page' : 5 navigations per 1s window → 5s block on violation
 *             (also disables all mouse input except scrolling during block)
 *
 * Blocking is enforced in-memory — no URL query params are added.
 */

export type RateLimiterMode = 'api' | 'page';

export interface RateLimiterConfig {
  /** Max requests/navigations allowed within the window */
  maxRequests: number;
  /** Rolling window in milliseconds */
  windowMs: number;
  /** How long to block once limit is exceeded, in milliseconds */
  blockDurationMs: number;
  /** Called when the rate limit is first exceeded */
  onBlock?: (unblockAt: Date) => void;
  /** Called when the block expires */
  onUnblock?: () => void;
}

export interface RateLimiterResult {
  /** Whether this request/navigation is allowed */
  allowed: boolean;
  /** If blocked, when the block lifts */
  unblockAt: Date | null;
  /** Remaining ms until unblock (0 if not blocked) */
  remainingMs: number;
}

const PRESETS: Record<RateLimiterMode, RateLimiterConfig> = {
  api: {
    maxRequests: 20,
    windowMs: 2_000,
    blockDurationMs: 5_000,
  },
  page: {
    maxRequests: 5,
    windowMs: 1_000,
    blockDurationMs: 5_000,
  },
};

class RateLimiter {
  private config: RateLimiterConfig;
  private timestamps: number[] = [];
  private blockedUntil: number | null = null;
  private unblockTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  check(): RateLimiterResult {
    const now = Date.now();

    // Already blocked?
    if (this.blockedUntil !== null) {
      if (now < this.blockedUntil) {
        return {
          allowed: false,
          unblockAt: new Date(this.blockedUntil),
          remainingMs: this.blockedUntil - now,
        };
      }
      // Block expired
      this.blockedUntil = null;
      this.timestamps = [];
      this.config.onUnblock?.();
    }

    // Prune timestamps outside the window
    const windowStart = now - this.config.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > windowStart);

    if (this.timestamps.length >= this.config.maxRequests) {
      // Exceeded — enter block
      this.blockedUntil = now + this.config.blockDurationMs;
      const unblockAt = new Date(this.blockedUntil);

      if (this.unblockTimer) clearTimeout(this.unblockTimer);
      this.unblockTimer = setTimeout(() => {
        this.blockedUntil = null;
        this.timestamps = [];
        this.config.onUnblock?.();
        this.unblockTimer = null;
      }, this.config.blockDurationMs);

      this.config.onBlock?.(unblockAt);

      return {
        allowed: false,
        unblockAt,
        remainingMs: this.config.blockDurationMs,
      };
    }

    // Within limit — record and allow
    this.timestamps.push(now);
    return { allowed: true, unblockAt: null, remainingMs: 0 };
  }

  isBlocked(): boolean {
    if (this.blockedUntil === null) return false;
    return Date.now() < this.blockedUntil;
  }

  remainingBlockMs(): number {
    if (!this.isBlocked() || this.blockedUntil === null) return 0;
    return Math.max(0, this.blockedUntil - Date.now());
  }

  reset(): void {
    this.timestamps = [];
    this.blockedUntil = null;
    if (this.unblockTimer) {
      clearTimeout(this.unblockTimer);
      this.unblockTimer = null;
    }
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────

let apiLimiter: RateLimiter | null = null;
let pageLimiter: RateLimiter | null = null;

function getApiLimiter(overrides?: Partial<RateLimiterConfig>): RateLimiter {
  if (!apiLimiter) {
    apiLimiter = new RateLimiter({ ...PRESETS.api, ...overrides });
  }
  return apiLimiter;
}

function getPageLimiter(overrides?: Partial<RateLimiterConfig>): RateLimiter {
  if (!pageLimiter) {
    pageLimiter = new RateLimiter({ ...PRESETS.page, ...overrides });
  }
  return pageLimiter;
}

/** Reset all singleton limiters (useful for testing) */
export function resetAllLimiters(): void {
  apiLimiter?.reset();
  pageLimiter?.reset();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call before any outbound fetch/API request.
 * Returns whether the request is allowed.
 */
export function checkApiRateLimit(
  overrides?: Partial<RateLimiterConfig>
): RateLimiterResult {
  return getApiLimiter(overrides).check();
}

/**
 * Call before any client-side page navigation.
 * Returns whether the navigation is allowed.
 */
export function checkPageRateLimit(
  overrides?: Partial<RateLimiterConfig>
): RateLimiterResult {
  return getPageLimiter(overrides).check();
}

export function isApiBlocked(): boolean {
  return getApiLimiter().isBlocked();
}

export function isPageBlocked(): boolean {
  return getPageLimiter().isBlocked();
}

export function apiBlockRemainingMs(): number {
  return getApiLimiter().remainingBlockMs();
}

export function pageBlockRemainingMs(): number {
  return getPageLimiter().remainingBlockMs();
}

/**
 * Configure callbacks on the API limiter.
 * Call this once during app initialisation.
 */
export function configureApiLimiter(overrides: Partial<RateLimiterConfig>): void {
  // Re-create with merged config so callbacks take effect immediately
  apiLimiter = new RateLimiter({ ...PRESETS.api, ...overrides });
}

/**
 * Configure callbacks on the page limiter.
 * Call this once during app initialisation.
 */
export function configurePageLimiter(overrides: Partial<RateLimiterConfig>): void {
  pageLimiter = new RateLimiter({ ...PRESETS.page, ...overrides });
}
