'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 bg-green-500 text-white rounded-lg font-medium transition-all duration-300 z-50 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <>
      <Toast message="✓ Copied to clipboard!" show={showToast} />
      <div className="relative group">
        <pre className="font-mono text-sm text-green-400 break-words whitespace-pre-wrap">{code}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/70 hover:text-white"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </>
  );
}

const allEndpoints = [
  {
    id: 'customers',
    title: 'Customers',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/customers',
    description: 'Retrieve customer data with filtering options',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'filter', type: 'string', description: 'active, inactive, or all' },
    ],
    example: '/api/v1/customers?limit=50&offset=0&filter=active',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/customers?filter=active',
  },
  {
    id: 'coupons',
    title: 'Coupons [DEPRECATED]',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/coupons [DEPRECATED]',
    description: 'Retrieve coupon codes with optional active filter',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'active_only', type: 'boolean', description: 'Show only active coupons (true/false)' },
    ],
    example: '/api/v1/coupons?limit=50&active_only=true',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/coupons?active_only=true',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/subscriptions',
    description: 'Retrieve subscription data',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
    ],
    example: '/api/v1/subscriptions?limit=50&offset=0',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/subscriptions',
  },
  {
    id: 'verse-scripts',
    title: 'Verse Scripts',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/verse-scripts',
    description: 'Search and retrieve Verse scripts',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'search', type: 'string', description: 'Search by script name' },
    ],
    example: '/api/v1/verse-scripts?search=example&limit=50',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/verse-scripts?search=example',
  },
  {
    id: 'trackers',
    title: 'Trackers',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/trackers',
    description: 'Retrieve trackers filtered by type',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'type', type: 'string', description: 'Filter by type (youtube, twitch, etc.)' },
    ],
    example: '/api/v1/trackers?type=youtube&limit=50',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/trackers?type=youtube',
  },
  {
    id: 'members',
    title: 'Members',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/members',
    description: 'Retrieve server members filtered by role or other criteria',
    parameters: [
      { name: 'limit', type: 'number', default: '100', description: 'Results per page (max 1000)' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'role', type: 'string', description: 'Filter by user role (admin, moderator, etc.)' },
    ],
    example: '/api/v1/members?role=admin&limit=50',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/members?role=admin',
  },
  {
    id: 'guild-settings',
    title: 'Guild Settings',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/guild-settings',
    description: 'Retrieve current Discord server configuration (read-only)',
    parameters: [],
    example: '/api/v1/guild-settings',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/guild-settings',
  },
  {
    id: 'server-config-update',
    title: 'Server Config (Update)',
    tier: 'enterprise' as const,
    method: 'PATCH',
    endpoint: '/api/v1/config',
    description: 'Partially update editable server configuration fields. Immutable fields (guild_id, server_tier, id, timestamps) are always blocked.',
    parameters: [
      { name: 'log_channel_id', type: 'string | null', description: 'Discord channel snowflake ID for bot logs' },
      { name: 'default_customer_role_id', type: 'string | null', description: 'Discord role snowflake ID assigned to new customers' },
      { name: 'encryption_enabled', type: 'boolean', description: 'Enable/disable at-rest field encryption' },
      { name: 'key_stored_on_server', type: 'boolean', description: 'Whether the encryption key is stored server-side' },
      { name: 'server_encryption_key', type: 'string | null', description: 'New encryption passphrase (omit to keep current)' },
      { name: 'admin_allowed_roles', type: 'string[]', description: 'Array of Discord role snowflake IDs that can use admin commands' },
    ],
    example: `PATCH /api/v1/config\nContent-Type: application/json\n\n{\n  "endpoint": "guild_settings_update",\n  "method": "POST",\n  "parameters": {\n    "fields": {\n      "log_channel_id": "1234567890123456789",\n      "encryption_enabled": true,\n      "admin_allowed_roles": ["9876543210987654321"]\n    }\n  }\n}`,
    curl: `curl -X PATCH \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "X-Discord-Server-ID: YOUR_SERVER_ID" \\\n  -H "Content-Type: application/json" \\\n  -d '{"endpoint":"guild_settings_update","method":"POST","parameters":{"fields":{"encryption_enabled":true}}}' \\\n  https://uefndevkit.rweb.site/api/v1/config`,
  },
  {
    id: 'redeem',
    title: 'Redeem Code',
    tier: 'enterprise' as const,
    method: 'POST',
    endpoint: '/api/v1/redeem',
    description: 'Redeem a code to activate premium or unlock features for a guild.',
    parameters: [
      { name: 'code', type: 'string', description: 'Alphanumeric code (letters, digits, hyphens, underscores only)' },
    ],
    example: `POST /api/v1/redeem\nContent-Type: application/json\n\n{\n  "endpoint": "redeem_code",\n  "method": "POST",\n  "parameters": { "code": "PREMIUM-ABC123" }\n}`,
    curl: `curl -X POST \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "X-Discord-Server-ID: YOUR_SERVER_ID" \\\n  -H "Content-Type: application/json" \\\n  -d '{"endpoint":"redeem_code","method":"POST","parameters":{"code":"PREMIUM-ABC123"}}' \\\n  https://uefndevkit.rweb.site/api/v1/redeem`,
  },
  {
    id: 'statistics',
    title: 'Statistics',
    tier: 'enterprise' as const,
    method: 'GET',
    endpoint: '/api/v1/statistics',
    description: 'Retrieve server statistics and analytics',
    parameters: [],
    example: '/api/v1/statistics',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/statistics',
  },
  {
    id: 'files',
    title: 'File Manager',
    tier: 'enterprise' as const,
    method: 'GET/POST',
    endpoint: '/api/v1/files',
    description: 'List, read, and write server files',
    parameters: [
      { name: 'filename', type: 'string', description: 'File name to read or write' },
      { name: 'content', type: 'string', description: 'File content (POST only)' },
    ],
    example: 'GET /api/v1/files\nPOST /api/v1/files {"filename":"config.json","content":"{}"}',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/files',
  },
  {
    id: 'reports',
    title: 'Reports',
    tier: 'enterprise' as const,
    method: 'GET/POST',
    endpoint: '/api/v1/reports',
    description: 'List reports and create new report submissions',
    parameters: [
      { name: 'user_id', type: 'string', description: 'Discord user ID to report' },
      { name: 'reason', type: 'string', description: 'Report reason' },
      { name: 'details', type: 'string', description: 'Additional details' },
    ],
    example: 'GET /api/v1/reports\nPOST /api/v1/reports {"user_id":"123","reason":"Spam","details":"..."}',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/reports',
  },
  {
    id: 'island-lookup',
    title: 'Island Lookup',
    tier: 'premium' as const,
    method: 'GET',
    endpoint: '/api/v1/island/lookup',
    description: 'Get detailed statistics for a Fortnite Creative island',
    parameters: [
      { name: 'island_code', type: 'string', description: 'Island code (format: XXXX-XXXX-XXXX)' },
    ],
    example: '/api/v1/island/lookup?island_code=1234-5678-9012',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" "https://uefndevkit.rweb.site/api/v1/island/lookup?island_code=1234-5678-9012"',
  },
  {
    id: 'island-predict',
    title: 'Island Predict',
    tier: 'premium' as const,
    method: 'GET',
    endpoint: '/api/v1/island/predict',
    description: 'Get AI-powered discovery predictions for an island',
    parameters: [
      { name: 'island_code', type: 'string', description: 'Island code (format: XXXX-XXXX-XXXX)' },
    ],
    example: '/api/v1/island/predict?island_code=1234-5678-9012',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" "https://uefndevkit.rweb.site/api/v1/island/predict?island_code=1234-5678-9012"',
  },
  {
    id: 'sellers',
    title: 'Sellers',
    tier: 'premium' as const,
    method: 'GET/POST',
    endpoint: '/api/v1/sellers',
    description: 'List seller profiles and create new seller entries',
    parameters: [
      { name: 'limit', type: 'number', default: '50', description: 'Results per page' },
      { name: 'offset', type: 'number', default: '0', description: 'Pagination offset' },
      { name: 'name', type: 'string', description: 'Seller name (POST only)' },
      { name: 'description', type: 'string', description: 'Seller description (POST only)' },
      { name: 'contact', type: 'string', description: 'Contact information (POST only)' },
      { name: 'region', type: 'string', description: 'Region (POST only)' },
    ],
    example: 'GET /api/v1/sellers?limit=50\nPOST /api/v1/sellers {"name":"Seller","description":"...","contact":"...","region":"US"}',
    curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/sellers',
  },
];

export function APIDocsComponent({ initialTier = 'enterprise' }: { initialTier?: 'enterprise' | 'premium' | 'all' }) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<'enterprise' | 'premium' | 'all'>(initialTier);

  const endpoints = allEndpoints;
  const filteredEndpoints = activeTier === 'all' ? endpoints : endpoints.filter(e => e.tier === activeTier);

  useEffect(() => {
    const newFiltered = activeTier === 'all' ? endpoints : endpoints.filter(e => e.tier === activeTier);
    if (newFiltered.length > 0) {
      setSelectedEndpoint(newFiltered[0].id);
    } else {
      setSelectedEndpoint(null);
    }

    const targetPath = activeTier === 'all' ? '/docs/api' : `/docs/${activeTier}`;
    if (pathname !== targetPath) {
      router.replace(targetPath, { scroll: false });
    }
  }, [activeTier, endpoints, pathname, router]);

  const selectedEndpointData = filteredEndpoints.find((e) => e.id === selectedEndpoint);

  const methodColor = (method: string) => {
    switch (method) {
      case 'GET':   return 'from-blue-500 to-cyan-500 shadow-blue-500/20';
      case 'POST':  return 'from-green-500 to-emerald-500 shadow-green-500/20';
      case 'PATCH': return 'from-yellow-500 to-orange-500 shadow-yellow-500/20';
      default:      return 'from-blue-500 to-cyan-500 shadow-blue-500/20';
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              activeTier === 'premium' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                : 'bg-red-500/20 border border-red-500/50 text-red-300'
            }`}>
              {activeTier === 'premium' ? 'PREMIUM ONLY' : 'ENTERPRISE ONLY'}
            </span>
            <div className="flex gap-2">
              {[
                { value: 'enterprise', label: 'Enterprise' },
                { value: 'premium', label: 'Premium' },
                { value: 'all', label: 'All' }
              ].map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setActiveTier(tier.value as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                    activeTier === tier.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {activeTier === 'premium' ? 'Premium API' : activeTier === 'all' ? 'All API Endpoints' : 'Enterprise API'}
          </h1>
          <p className="text-lg text-white/60 mb-3">
            {activeTier === 'premium' 
              ? 'RESTful API endpoints for premium servers accessing UEFN DevKit data'
              : activeTier === 'all'
              ? 'All available API endpoints across Enterprise and Premium tiers'
              : 'RESTful API endpoints for enterprise servers accessing UEFN DevKit data'}
          </p>
          <p className="text-sm text-white/50 italic">
            {activeTier === 'premium'
              ? 'Premium tier features include Island Lookup, Predictions, and Seller Management.'
              : activeTier === 'all'
              ? 'Enterprise features include data management; Premium features include island analysis and seller profiles.'
              : 'This is currently an enterprise-only feature. Premium tier availability to be determined.'}
          </p>
        </div>
      </section>

      {/* Authentication Section */}
      <section className="py-12 md:py-16 border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Authentication</h2>
          <div className="space-y-4">
            <p className="text-white/70 text-base leading-relaxed">All requests require the following headers:</p>
            <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
              <CopyableCode
                code={`Authorization: Bearer {timestamp}.{signature}
X-Discord-Server-ID: {your_server_id}
Origin: https://your-domain.com`}
              />
            </div>
            <p className="text-white/70 text-base">
              The token uses <strong className="text-white">HMAC-SHA256</strong> signing. Rate limit: <strong className="text-white">10 requests/sec</strong> | Monthly quota: <strong className="text-white">5,000 requests</strong>
            </p>
            <div className="mt-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-yellow-300 text-sm font-semibold mb-1">⚠️ Field Validation (PATCH / POST endpoints)</p>
              <p className="text-white/60 text-sm">
                All write endpoints enforce strict type checking. Booleans must be JSON booleans, timestamps cannot be overwritten,
                snowflake IDs must be numeric strings of 17–20 digits, and arrays must contain only valid snowflake strings.
                Attempts to write immutable fields (<code className="text-cyan-400">guild_id</code>, <code className="text-cyan-400">server_tier</code>, <code className="text-cyan-400">id</code>, timestamps) are rejected with HTTP 422.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Endpoint List */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold mb-4 text-white">Endpoints</h3>
              <div className="space-y-2 flex flex-col">
                {filteredEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`px-4 py-3 rounded-lg text-left transition-all font-medium ${
                      selectedEndpoint === endpoint.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-mono font-bold ${
                        endpoint.method === 'PATCH' ? 'text-yellow-300'
                        : endpoint.method === 'POST' ? 'text-green-300'
                        : selectedEndpoint === endpoint.id ? 'text-blue-200' : 'text-blue-300'
                      }`}>{endpoint.method}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        endpoint.tier === 'premium'
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                          : 'bg-red-500/30 text-red-300 border border-red-500/50'
                      }`}>
                        {endpoint.tier}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{endpoint.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Details */}
            <div className="md:col-span-3">
              {selectedEndpointData ? (
                <div className="space-y-8">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className={`bg-gradient-to-r ${methodColor(selectedEndpointData.method)} px-3 py-1 rounded font-bold text-sm shadow-lg`}>
                        {selectedEndpointData.method}
                      </span>
                      <code className="text-white font-mono font-semibold text-base">{selectedEndpointData.endpoint}</code>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                        selectedEndpointData.tier === 'premium'
                          ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                          : 'bg-red-500/30 text-red-300 border-red-500/50'
                      }`}>
                        {selectedEndpointData.tier.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white text-lg font-medium leading-relaxed">{selectedEndpointData.description}</p>
                  </div>

                  {/* Parameters */}
                  {selectedEndpointData.parameters.length > 0 && (
                    <div>
                      <h4 className="text-xl font-bold mb-4 text-white">Parameters</h4>
                      <div className="space-y-3">
                        {selectedEndpointData.parameters.map((param) => (
                          <div key={param.name} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-baseline gap-2 mb-2">
                              <code className="font-mono text-blue-300 font-semibold">{param.name}</code>
                              <span className="text-white/50 text-sm font-medium">({param.type})</span>
                              {'default' in param && <span className="text-white/50 text-sm font-medium">= {(param as { default: string }).default}</span>}
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  <div>
                    <h4 className="text-xl font-bold mb-4 text-white">Example Request</h4>
                    <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <CopyableCode code={selectedEndpointData.example} />
                    </div>
                  </div>

                  {/* cURL */}
                  <div>
                    <h4 className="text-xl font-bold mb-4 text-white">cURL Command</h4>
                    <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <CopyableCode code={selectedEndpointData.curl} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="text-6xl mb-6 opacity-50">📡</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Endpoint Selected</h3>
                  <p className="text-white/50 text-center max-w-md">
                    Select an endpoint from the list on the left to view its details, parameters, and example usage.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
