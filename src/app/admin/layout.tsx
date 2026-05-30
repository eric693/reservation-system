'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider } from '@/components/ui/Toast';

// adminOnly: hidden from staff role
const navItems: { href: string; label: string; adminOnly?: boolean; children?: { href: string; label: string }[] }[] = [
  { href: '/admin', label: '控制台' },
  { href: '/admin/appointments', label: '預約管理', children: [
    { href: '/admin/appointments/list', label: '預約列表' },
    { href: '/admin/appointments/calendar', label: '預約行事曆' },
  ]},
  { href: '/admin/waitlist', label: '候補名單' },
  { href: '/admin/services', label: '服務管理' },
  { href: '/admin/packages', label: '套票管理' },
  { href: '/admin/portfolio', label: '作品集' },
  { href: '/admin/staff', label: '員工列表', adminOnly: true },
  { href: '/admin/schedules', label: '員工排班' },
  { href: '/admin/customers', label: '顧客管理' },
  { href: '/admin/inventory', label: '庫存管理' },
  { href: '/admin/marketing', label: '自動行銷', adminOnly: true },
  { href: '/admin/coupons', label: '優惠券管理', adminOnly: true },
  { href: '/admin/reviews', label: '評價管理', adminOnly: true },
  { href: '/admin/blocked-slots', label: '封鎖時段' },
  { href: '/admin/reports', label: '報表列表', adminOnly: true },
  { href: '/admin/settings', label: '商家設定', adminOnly: true },
  { href: '/admin/announcements', label: '公告列表', adminOnly: true },
  { href: '/admin/users', label: '帳號管理', adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>('/admin/appointments');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return; }
      r.json().then(d => {
        if (d.user.role === 'customer') { router.replace('/customer'); return; }
        setUser(d.user);
      });
    });
  }, [router]);

  const fetchNotifs = () => {
    fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      setUnreadCount(d.unread);
      setNotifs(d.notifications.slice(0, 10));
    });
  };

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications/all-read', { method: 'POST' });
    fetchNotifs();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: '#2C2420' }}>
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#8B7355' }}>
          {user?.name?.[0]?.toUpperCase() || '美'}
        </div>
        <span className="text-white font-semibold text-lg">{user?.name || '美甲'}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map(item => {
          const isActive = pathname === item.href || (item.children && item.children.some(c => pathname === c.href));
          const isExpanded = expandedNav === item.href;
          return (
            <div key={item.href}>
              <button
                onClick={() => {
                  if (item.children) { setExpandedNav(isExpanded ? null : item.href); }
                  else { router.push(item.href); setSidebarOpen(false); }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={isActive && !item.children ? { background: 'rgba(139,115,85,0.3)' } : {}}
              >
                <span className="flex-1">{item.label}</span>
                {item.children && <span className="text-xs opacity-60">{isExpanded ? '▲' : '▼'}</span>}
              </button>
              {item.children && isExpanded && (
                <div style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {item.children.map(child => (
                    <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                      className={`block pl-8 pr-4 py-2 text-sm transition-colors ${pathname === child.href ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={logout} className="w-full py-2 text-sm text-gray-400 hover:text-white text-left transition-colors">登出</button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8F5F0' }}>
      <div className="hidden md:flex md:w-48 flex-shrink-0 flex-col">
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56"><Sidebar /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(o => !o)} className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style={{ background: '#EF4444' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-sm text-gray-800">通知</span>
                      {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">全部標為已讀</button>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">無新通知</div>
                      ) : notifs.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 text-sm ${!n.is_read ? 'bg-amber-50' : ''}`}>
                          <div className="font-medium text-gray-800">{n.title}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{n.body}</div>
                          <div className="text-gray-300 text-xs mt-0.5">{n.created_at?.slice(0,16).replace('T',' ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: '#8B7355' }}>
                {user.name[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
