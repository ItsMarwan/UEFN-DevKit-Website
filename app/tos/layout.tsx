import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('tos');

export default function TosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
