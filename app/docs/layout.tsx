import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('docs');

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
