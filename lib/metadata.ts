import type { Metadata } from 'next';

const BASE_URL = 'https://uefndevkit.rweb.site';
const DEFAULT_IMAGE = `${BASE_URL}/images/banner.png`;

export function generateMetadata(
  title: string,
  description: string,
  path: string = '',
  customImage?: string
): Metadata {
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  const image = customImage || DEFAULT_IMAGE;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: '%s | UEFN DevKit',
    },
    description,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: 'UEFN DevKit',
      title,
      description,
      images: [
        {
          url: image,
          secureUrl: image,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@UEFNDevKit',
    },
  };
}

export const pageMetadata = {
  home: {
    title: 'UEFN DevKit – #1 Discord Bot for Fortnite Island Builders',
    description:
      'Customer management, session channels, Verse script uploads, live island analytics, seller directory & more.',
    path: '/',
  },
  commands: {
    title: 'Commands – UEFN DevKit Discord Bot',
    description: 'Complete list of UEFN DevKit commands for managing your Fortnite island community.',
    path: '/commands',
  },
  dashboard: {
    title: 'Dashboard – UEFN DevKit',
    description: 'Manage your server settings, customers, coupons, and analytics in real-time.',
    path: '/dashboard',
  },
  docs: {
    title: 'Documentation – UEFN DevKit',
    description: 'Complete guides and API documentation for UEFN DevKit integration.',
    path: '/docs',
  },
  premium: {
    title: 'Premium – UEFN DevKit',
    description: 'Unlock advanced features with UEFN DevKit Premium.',
    path: '/premium',
  },
  invite: {
    title: 'Invite – UEFN DevKit Discord Bot',
    description: 'Add UEFN DevKit to your Discord server today.',
    path: '/invite',
  },
  contact: {
    title: 'Contact – UEFN DevKit',
    description: 'Get in touch with the UEFN DevKit team.',
    path: '/contact',
  },
  tos: {
    title: 'Terms of Service – UEFN DevKit',
    description: 'Read our terms of service.',
    path: '/tos',
  },
  privacy: {
    title: 'Privacy Policy – UEFN DevKit',
    description: 'Read our privacy policy.',
    path: '/privacy',
  },
};
