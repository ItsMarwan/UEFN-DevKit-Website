'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLegal } from '@/components/LegalProvider';

export default function TosPage() {
  const router = useRouter();
  const { openLegal } = useLegal();

  useEffect(() => {
    router.replace('/');
    const t = setTimeout(() => openLegal('tos'), 150);
    return () => clearTimeout(t);
  }, [router, openLegal]);

  return null;
}