import { getMetadataForPage } from '@/lib/metadata';

export const metadata = getMetadataForPage('contact');

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
