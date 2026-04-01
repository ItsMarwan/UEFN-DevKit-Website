import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('commands');

export default function CommandsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
