import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_APP_ORIGIN = 'https://uefndevkit.rweb.site';

const ALLOWED_WEBSITE_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_ORIGIN,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV !== 'production' ? 'https://localhost:3000' : null,
].filter(Boolean) as string[];

export function isWebsiteOnlyRequest(req: NextRequest): boolean {
  const origin = (req.headers.get('origin') ?? '').trim();
  const referer = (req.headers.get('referer') ?? '').trim();
  const secFetchSite = (req.headers.get('sec-fetch-site') ?? '').toLowerCase();

  const originAllowed = origin && ALLOWED_WEBSITE_ORIGINS.includes(origin);
  const refererAllowed = referer && ALLOWED_WEBSITE_ORIGINS.some((allowed) => referer.startsWith(allowed));
  const sameSiteBrowserRequest = secFetchSite === 'same-origin' || secFetchSite === 'same-site';

  return Boolean(originAllowed || refererAllowed || sameSiteBrowserRequest);
}

export function requireWebsiteOnlyRequest(req: NextRequest): null | NextResponse {
  if (isWebsiteOnlyRequest(req)) {
    return null;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
