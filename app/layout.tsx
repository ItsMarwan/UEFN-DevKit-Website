import type { Metadata } from 'next';
import { getMetadataForPage } from '@/lib/metadata';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { LegalProvider } from '@/components/LegalProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { RateLimitProvider } from '@/components/RateLimitProvider';
import './globals.css';

const BASE_URL = 'https://uefndevkit.rweb.site';

export const metadata: Metadata = getMetadataForPage('home');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2399df" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UEFN DevKit" />
        <meta name="application-name" content="UEFN DevKit" />
        <meta name="msapplication-TileColor" content="#2399df" />
        <meta name="msapplication-TileImage" content="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: 'UEFN DevKit',
                  description: 'The most powerful Discord bot for UEFN Fortnite island builders.',
                  publisher: { '@id': `${BASE_URL}/#organization` },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${BASE_URL}/search?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': `${BASE_URL}/#organization`,
                  name: 'UEFN DevKit',
                  url: BASE_URL,
                  logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png`, width: 512, height: 512 },
                  image: { '@type': 'ImageObject', url: `${BASE_URL}/images/banner.png`, width: 1200, height: 630 },
                  contactPoint: { '@type': 'ContactPoint', contactType: 'Customer Support', url: BASE_URL },
                  sameAs: ['https://discord.gg/wfPfEw6b6w', 'https://twitter.com/itsmarwanuefn'],
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'UEFN DevKit',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Discord',
                  url: BASE_URL,
                  image: `${BASE_URL}/images/banner.png`,
                  description: 'All-in-one Discord bot for UEFN Fortnite island builders. Customer management, session channels, island analytics, Verse script uploads, and seller profiles.',
                  author: { '@type': 'Organization', name: 'UEFN DevKit' },
                  offers: [
                    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
                    { '@type': 'Offer', name: 'Premium', price: '9.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', duration: 'P1M' },
                  ],
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8',
                    ratingCount: '127',
                  },
                  downloadUrl: 'https://discord.gg/wfPfEw6b6w',
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-black text-white overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500">
        <GoogleAnalytics />
        <ToastProvider>
          <RateLimitProvider>
            <LegalProvider>
              <LayoutWrapper>
                <Navigation />
                <main>{children}</main>
              </LayoutWrapper>
            </LegalProvider>
          </RateLimitProvider>
        </ToastProvider>
      </body>
    </html>
  );
}