import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('invite');

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
