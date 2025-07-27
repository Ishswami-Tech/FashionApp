'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderFormLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('auth') === 'true';
      if (!isAuth) {
        router.replace('/auth');
      } else {
        setChecking(false);
      }
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}