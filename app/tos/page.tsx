'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TosPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?legal=tos');
  }, [router]);

  return null;
}