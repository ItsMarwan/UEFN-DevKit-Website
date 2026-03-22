'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

function DocsContent() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>('customers');
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');

  const endpoints = [
    {
      id: 'customers',
      title: 'Customers',
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
      title: 'Coupons',
      method: 'GET',
      endpoint: '/api/v1/coupons',
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
      method: 'GET',
      endpoint: '/api/v1/members',
      description: 'Retrieve members filtered by role',
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
      method: 'GET',
      endpoint: '/api/v1/guild-settings',
      description: 'Retrieve Discord server configuration',
      parameters: [],
      example: '/api/v1/guild-settings',
      curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/guild-settings',
    },
    {
      id: 'statistics',
      title: 'Statistics',
      method: 'GET',
      endpoint: '/api/v1/statistics',
      description: 'Retrieve server statistics and analytics',
      parameters: [],
      example: '/api/v1/statistics',
      curl: 'curl -H "Authorization: Bearer YOUR_TOKEN" -H "X-Discord-Server-ID: YOUR_SERVER_ID" https://uefndevkit.rweb.site/api/v1/statistics',
    },
  ];

  const selectedEndpointData = endpoints.find((e) => e.id === selectedEndpoint);

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Header */}
      <section className="py-12 md:py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs font-semibold text-red-300">
              ENTERPRISE ONLY
            </span>
            <div className="flex gap-2">
              {['enterprise', 'premium'].map((tier) => (
                <a
                  key={tier}
                  href={`?highlight=${tier}`}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
                    highlight === tier
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </a>
              ))}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Enterprise API
          </h1>
          <p className="text-lg text-white/60 mb-3">
            RESTful API endpoints for enterprise servers accessing UEFN DevKit data
          </p>
          <p className="text-sm text-white/50 italic">
            This is currently an enterprise-only feature. Premium tier availability to be determined.
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
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`px-4 py-3 rounded-lg text-left transition-all font-medium ${
                      selectedEndpoint === endpoint.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-mono text-blue-300 block font-semibold">{endpoint.method}</span>
                    <span className="text-sm font-semibold">{endpoint.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint Details */}
            <div className="md:col-span-3">
              {selectedEndpointData && (
                <div className="space-y-8">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 rounded font-bold text-sm shadow-lg shadow-blue-500/20">
                        {selectedEndpointData.method}
                      </span>
                      <code className="text-white font-mono font-semibold text-base">{selectedEndpointData.endpoint}</code>
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
                              {param.default && <span className="text-white/50 text-sm font-medium">= {param.default}</span>}
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-white">Example Request</h4>
                    <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <CopyableCode code={selectedEndpointData.example} />
                    </div>
                  </div>

                  {/* cURL */}
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-white">cURL</h4>
                    <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <CopyableCode code={selectedEndpointData.curl} />
                    </div>
                  </div>

                  {/* Response */}
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-white">Response Format</h4>
                    <div className="bg-black/50 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <CopyableCode
                        code={`{
  "success": true,
  "endpoint": "${selectedEndpointData.id}",
  "count": 25,
  "total": 150,
  "data": [
    { /* object data */ }
  ]
}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Error Codes */}
      <section className="py-12 md:py-16 border-t border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Error Codes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { code: '401', message: 'Missing or invalid authentication headers' },
              { code: '403', message: 'Origin domain not whitelisted or token verification failed' },
              { code: '429', message: 'Rate limit exceeded (10 requests/sec)' },
              { code: '500', message: 'Server error' },
            ].map((error) => (
              <div key={error.code} className="bg-black/50 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                <code className="text-red-400 font-mono font-bold text-base">{error.code}</code>
                <p className="text-white/70 text-sm mt-1 leading-relaxed">{error.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function APIDocsPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <DocsContent />
    </Suspense>
  );
}
