'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { href: '/customer', label: '首頁', icon: '🏠' },
  { href: '/customer/booking', label: '預約', icon: '📅' },
  { href: '/customer/notifications', label: '消息', icon: '🔔' },
  { href: '/customer/portfolio', label: '作品集', icon: '🖼' },
  { href: '/customer/profile', label: '我的', icon: '👤' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return; }
      r.json().then(d => setUser(d.user));
    });
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8F5F0', maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-40" style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <div className="flex">
          {tabs.map(tab => {
            const isActive = tab.href === '/customer' ? pathname === '/customer' : pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
                style={{ color: isActive ? '#8B7355' : '#9CA3AF' }}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
