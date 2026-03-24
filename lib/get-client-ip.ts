import { NextRequest } from 'next/server';

/**
 * Extract client IP address from NextRequest
 * Checks multiple headers in order of preference
 */
export function getClientIp(req: NextRequest): string {
  // Check X-Forwarded-For header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}
