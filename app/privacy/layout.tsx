import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('privacy');

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
