'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) {
        r.json().then(d => {
          if (d.user.role === 'customer') router.replace('/customer');
          else router.replace('/admin');
        });
      } else {
        router.replace('/login');
      }
    });
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );
}
