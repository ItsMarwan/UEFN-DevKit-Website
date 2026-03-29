/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/api/docs', destination: '/docs/api' },
      { source: '/api/docs/premium', destination: '/docs/premium' },
      { source: '/api/docs/enterprise', destination: '/docs/enterprise' },
      { source: '/api/docs/api', destination: '/docs/api' },
      { source: '/lib/commands.ts', destination: '/api/lib/commands' },
      { source: '/lib/api', destination: '/api/lib/api' },
      { source: '/lib/api.ts', destination: '/api/lib/api' },
    ];
  },
};

module.exports = nextConfig;
