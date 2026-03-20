'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLegal } from '@/components/LegalProvider';

export default function PrivacyPage() {
  const router = useRouter();
  const { openLegal } = useLegal();

  useEffect(() => {
    router.replace('/');
    // Small delay to let the home page render first
    const t = setTimeout(() => openLegal('privacy'), 150);
    return () => clearTimeout(t);
  }, [router, openLegal]);

  return null;
}