import { NextResponse, type NextRequest } from "next/server";

const ALLOW_PREVIEW = process.env.ALLOW_PREVIEW === 'true';

const API_ROUTES = [
  { path: '/api/health', title: 'Health', requiresAuth: false, description: 'Health check (no auth)', docs: '/docs/api' },
  { path: '/api/v1/verse', title: 'Verse', requiresAuth: true, description: 'Verse command APIs', docs: '/docs/api' },
  { path: '/api/v1/verse-scripts', title: 'Verse Scripts', requiresAuth: true, description: 'Verse scripts upload/listing', docs: '/docs/api' },
  { path: '/api/v1/trackers', title: 'Trackers', requiresAuth: true, description: 'Trackers endpoint', docs: '/docs/api' },
  { path: '/api/v1/members', title: 'Members', requiresAuth: true, description: 'Members endpoint', docs: '/docs/api' },
  { path: '/api/v1/reports', title: 'Reports', requiresAuth: true, description: 'Reports endpoint', docs: '/docs/api' },
  { path: '/api/v1/guild-settings', title: 'Guild Settings', requiresAuth: true, description: 'Guild configuration', docs: '/docs/api' },
  { path: '/api/v1/coupons', title: 'Coupons', requiresAuth: true, description: 'Coupon lookup', docs: '/docs/api' },
  { path: '/api/v1/customers', title: 'Customers', requiresAuth: true, description: 'Customer management', docs: '/docs/api' },
  { path: '/api/v1/island', title: 'Island', requiresAuth: true, description: 'Island lookup/predict', docs: '/docs/api' },
  { path: '/api/v1/stats', title: 'Stats', requiresAuth: true, description: 'Usage stats', docs: '/docs/api' },
  { path: '/api/v1/quota', title: 'Quota', requiresAuth: true, description: 'Quota status', docs: '/docs/api' },
  { path: '/api/dashboard/session', title: 'Dashboard Session', requiresAuth: true, description: 'Session token', docs: '/docs/api' },
  { path: '/api/dashboard/verify-access', title: 'Verify Access', requiresAuth: true, description: 'Dashboard access validations', docs: '/docs/api' },
];

function getRouteEntry(path) {
  return API_ROUTES.find((r) => r.path === path) || { path, title: 'Unknown', requiresAuth: true, description: 'See docs', docs: '/docs/api' };
}

function getV1RedirectTarget(pathname) {
  if (!pathname.startsWith('/api/') || pathname.startsWith('/api/v1/') || pathname === '/api/docs' || pathname.startsWith('/api/docs/')) {
    return null;
  }

  const candidate = '/api/v1' + pathname.substring('/api'.length);
  return API_ROUTES.some((r) => r.path === candidate) ? candidate : null;
}

function getApiNotFoundHtml(currentPath) {
  const listItems = API_ROUTES
    .map((r) => `<li><strong>${r.title}</strong> <code>${r.path}</code> - ${r.description} - ${r.requiresAuth ? 'requires auth' : 'public'} (<a href="${r.docs}" style="color:#a5f3fc">docs</a>)</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 API Not Found</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #000; color: #fff; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }
    .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; }
    .box { width: min(100%, 950px); background: rgba(11, 20, 44, 0.95); border: 1px solid rgba(34, 139, 230, 0.4); border-radius: 16px; box-shadow: 0 12px 52px rgba(0,0,0,0.6); padding: 2rem; }
    h1 { margin: 0; padding: 0; font-size: clamp(1.8rem, 2.4vw, 2.6rem); }
    p { margin: 0.5rem 0; color: #dbeafe; }
    a { color: #7dd3fc; text-decoration: none; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    ul { margin: 0.6rem 0 0.8rem 1rem; padding: 0; }
    li { margin-bottom: 0.45rem; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h1>404 API Not Found</h1>
      <p>The endpoint <code>${currentPath}</code> does not exist.</p>
      <p>Please use one of these supported endpoints:</p>
      <ul>${listItems}</ul>
      <p>Read documentation at <a href="/api/docs">/api/docs</a>.</p>
      <p><a href="/dashboard">Back to dashboard</a></p>
    </div>
  </div>
</body>
</html>`;
}

function getV1HintHtml(currentPath, targetPath) {
  const listItems = API_ROUTES
    .map((r) => `<li><strong>${r.title}</strong> <code>${r.path}</code> - ${r.description} - ${r.requiresAuth ? 'requires auth' : 'public'} (<a href="${r.docs}" style="color:#a5f3fc">docs</a>)</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Redirect Hint</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #000; color: #fff; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }
    .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; }
    .box { width: min(100%, 950px); background: rgba(11, 20, 44, 0.95); border: 1px solid rgba(34, 139, 230, 0.4); border-radius: 16px; box-shadow: 0 12px 52px rgba(0,0,0,0.6); padding: 2rem; position: relative; }
    .countdown { position: absolute; bottom: 1rem; right: 1rem; font-size: 0.9rem; background: rgba(15, 23, 42, 0.7); border-radius: 8px; padding: 0.35rem 0.7rem; color: #fff; border: 1px solid #60a5fa; }
    h1 { margin: 0; font-size: clamp(1.8rem, 2.4vw, 2.6rem); }
    p { margin: 0.5rem 0; color: #dbeafe; }
    a { color: #7dd3fc; text-decoration: none; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    ul { margin: 0.6rem 0 0.8rem 1rem; padding: 0; }
    li { margin-bottom: 0.45rem; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">
      <h1>Did you forget to add <code>/v1</code>?</h1>
      <p>You requested <code>${currentPath}</code>, but this endpoint lives at <code>${targetPath}</code>.</p>
      <p>Redirecting in <strong id="countdown">10</strong>s so you don’t have to type it twice. 😉</p>
      <p>If you want to call it directly, use <a href="${targetPath}">${targetPath}</a> (or API client).</p>
      <h2>Available APIs</h2>
      <ul>${listItems}</ul>
      <p>Read docs at <a href="/api/docs">/api/docs</a>.</p>
      <div class="countdown" aria-live="polite">Redirecting in <span id="countdown-badge">10</span>s</div>
    </div>
  </div>
  <script>
    const target = '${targetPath}';
    let timeLeft = 10;
    const badge = document.getElementById('countdown-badge');
    const interval = setInterval(() => {
      timeLeft -= 1;
      badge.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(interval);
        window.location.href = target;
      }
    }, 1000);
  </script>
</body>
</html>`;
}

function getAccessDeniedHtml(currentPath, previewData = null, responseStatus = 403) {
  const routeEntry = getRouteEntry(currentPath);
  const statusHeading = responseStatus === 200 ? '200 OK' : '403 Forbidden';
  const statusMessage = responseStatus === 200 ? 'API preview mode enabled; direct browser navigation to this endpoint is shown for convenience.' : 'Direct browser endpoints are blocked; use the API docs and proper API client.';

  const listItems = API_ROUTES.map((r) => `        <li><strong>${r.title}</strong> <code>${r.path}</code> - ${r.description} - ${r.requiresAuth ? 'requires auth' : 'public'} (<a href="${r.docs}" style="color:#a5f3fc">docs</a>)</li>`).join('');

  const sampleHeaders = [
    `GET ${routeEntry.path} HTTP/1.1`,
    'Host: your-domain.com',
    routeEntry.requiresAuth ? 'Authorization: Bearer {YOUR_TOKEN}' : '# Authorization not required for this endpoint',
    routeEntry.path !== '/api/health' ? 'X-Discord-Server-ID: {GUILD_ID}' : '# Optional for health',
    'Origin: https://app.your-domain.com',
    'Accept: application/json',
  ].filter((line) => !line.startsWith('#'));

  const previewSection = previewData
    ? `<h2 style="margin-top: 1.2rem;">Live API Preview</h2>
      <pre style="background:#0b1123; color:#d1e8ff; border:1px solid #1e40af; border-radius: 10px; padding: 1rem; max-height: 15rem; overflow:auto; font-size:0.93rem;"><code>${previewData}</code></pre>`
    : '';

  const previewConsoleScript = previewData
    ? `<script>console.log('API preview data:', ${JSON.stringify(previewData)});</script>`
    : `<script>console.log('API preview mode is enabled but no preview data found.');</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>403 Forbidden - API Access</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #000; color: #fff; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }
    .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; max-width: 40%; margin: 0 auto; }
    .box { width: min(100%, 950px); background: rgba(11, 20, 44, 0.95); border: 1px solid rgba(34, 139, 230, 0.4); border-radius: 16px; box-shadow: 0 12px 52px rgba(0,0,0,0.6); padding: 2rem; }
    .header { display: flex; align-items: flex-start; gap: 0.75rem; }
    .icon { font-size: 2rem; margin-top: 0.2rem; }
    h1 { margin: 0; padding: 0; font-size: clamp(1.8rem, 2.4vw, 2.6rem); }
    p { margin: 0.5rem 0; color: #dbeafe; }
    a { color: #7dd3fc; text-decoration: none; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    ul { margin: 0.6rem 0 0.8rem 1rem; padding: 0; }
    li { margin-bottom: 0.45rem; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="container ">
    <div class="box">
      <div class="header">
        <div class="icon">🔒</div>
        <div>
          <h1 style="">${statusHeading}</h1>
          <p>${statusMessage}</p>
        </div>
      </div>

      <p><strong>Current API:</strong> ${routeEntry.title} (${routeEntry.path}) - ${routeEntry.description}</p>
      <p><strong>Auth required:</strong> ${routeEntry.requiresAuth ? 'Yes' : 'No (public)'}</p>
      <p><strong>Endpoint docs:</strong> <a href="${routeEntry.docs}">${routeEntry.docs}</a></p>


      <h2 style="margin:1rem 0 0.5rem;">Example request</h2>
      <pre style="background: #020617; color: #cfe3ff; border: 1px solid #1e40af; border-radius: 10px; padding: 1rem; white-space: pre-wrap;">${sampleHeaders.join('\n')}</pre>

      ${previewSection}

      <p style="margin-top: 1rem; color: #93c5fd;">Read more in <a href="/api/docs">/api/docs</a> (rewritten to /docs/api).</p>
      <p style="margin-top: .3rem;"><a href="/dashboard">Open Dashboard</a></p>
    </div>
  </div>
  ${previewConsoleScript}
</body>
</html>`;
}



function isBrowserDirectApiRequest(request: NextRequest): boolean {
  // Only apply protection to API routes.
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return false;
  }

  // Do not block the API docs entrypoint or its subpaths.
  if (request.nextUrl.pathname === "/api/docs" || request.nextUrl.pathname.startsWith("/api/docs/")) {
    return false;
  }

  const accept = (request.headers.get("accept") ?? "").toLowerCase();
  const secFetchDest = (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  const userAgent = (request.headers.get("user-agent") ?? "").toLowerCase();
  const xRequestedWith = (request.headers.get("x-requested-with") ?? "").toLowerCase();

  const isDocumentNavigation = secFetchDest === "document";
  const acceptsHtml = accept.includes("text/html") || accept.includes("application/xhtml+xml");
  const isBrowser = /mozilla|chrome|safari|firefox|edge|opera/.test(userAgent);
  const isXHR = xRequestedWith === "xmlhttprequest";

  // Prevent direct URL navigation by users in the browser while allowing programmatic API requests.
  return isDocumentNavigation || (acceptsHtml && isBrowser && request.method === "GET" && !isXHR);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow preview fetches to pass through to the real API route.
  if (request.headers.get('x-api-preview') === '1') {
    return NextResponse.next();
  }

  if (pathname === '/api/docs' || pathname.startsWith('/api/docs/')) {
    return NextResponse.next();
  }

  const v1Target = getV1RedirectTarget(pathname);
  if (v1Target) {
    const absoluteV1Url = new URL(v1Target, request.url);

    if (isBrowserDirectApiRequest(request)) {
      return new NextResponse(getV1HintHtml(pathname, absoluteV1Url.toString()), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }

    return NextResponse.redirect(absoluteV1Url);
  }

  const routeFound = API_ROUTES.some((route) => route.path === pathname);

  if (!routeFound) {
    if (isBrowserDirectApiRequest(request)) {
      return new NextResponse(getApiNotFoundHtml(pathname), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }
    return NextResponse.json({ status: 'error', message: 'API not found', path: pathname, docs: '/api/docs' }, { status: 404 });
  }

  if (isBrowserDirectApiRequest(request)) {
    let previewData = null;

    if (ALLOW_PREVIEW && request.method === 'GET') {
      try {
        const previewResponse = await fetch(new URL(pathname, request.url), {
          method: 'GET',
          headers: {
            'x-api-preview': '1',
            'Accept': 'application/json',
          },
        });

        const text = await previewResponse.text();
        try {
          const parsed = JSON.parse(text);
          previewData = JSON.stringify(parsed, null, 2);
        } catch {
          previewData = text;
        }
      } catch (error) {
        previewData = `Preview error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    const isPreviewActive = ALLOW_PREVIEW && previewData !== null;
    const responseStatus = isPreviewActive ? 200 : 403;

    return new NextResponse(getAccessDeniedHtml(pathname, previewData, responseStatus), {
      status: responseStatus,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
