import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('patreon');

export default function PatreonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
