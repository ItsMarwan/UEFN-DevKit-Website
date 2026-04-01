import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('premium');

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
