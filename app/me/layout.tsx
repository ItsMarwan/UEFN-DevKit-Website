import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('me');

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
