'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--primary)' : 'none'} stroke={active ? 'var(--primary)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  );
}
function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconBell({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function IconImage({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  );
}
function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

const tabs = [
  { href: '/customer', label: '首頁', Icon: IconHome },
  { href: '/customer/booking', label: '預約', Icon: IconCalendar },
  { href: '/customer/notifications', label: '消息', Icon: IconBell },
  { href: '/customer/portfolio', label: '作品集', Icon: IconImage },
  { href: '/customer/profile', label: '我的', Icon: IconUser },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return; }
    });
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-page)', maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-40" style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <div className="flex">
          {tabs.map(({ href, label, Icon }) => {
            const isActive = href === '/customer' ? pathname === '/customer' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors">
                <Icon active={isActive} />
                <span className="text-xs" style={{ color: isActive ? 'var(--primary)' : '#9CA3AF' }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
