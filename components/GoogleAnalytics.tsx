'use client';

import Script from 'next/script';
import { memo } from 'react';
import { useCookieConsent } from './CookieProvider';

export const GoogleAnalytics = memo(function GoogleAnalytics() {
  const { consent } = useCookieConsent();
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const shouldRender = gaId && consent?.analytics;

  return shouldRender ? (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  ) : null;
});
