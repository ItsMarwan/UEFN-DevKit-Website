import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('dashboard');

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
