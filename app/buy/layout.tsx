import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('buy');

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
