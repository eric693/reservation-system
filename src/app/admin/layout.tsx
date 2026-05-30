'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/admin', label: '控制台', icon: '⊞' },
  { href: '/admin/appointments', label: '預約管理', icon: '📅', children: [
    { href: '/admin/appointments/list', label: '預約列表' },
    { href: '/admin/appointments/calendar', label: '預約行事曆' },
  ]},
  { href: '/admin/services', label: '服務管理', icon: '✂' },
  { href: '/admin/portfolio', label: '作品集列表', icon: '🖼' },
  { href: '/admin/staff', label: '員工列表', icon: '👤' },
  { href: '/admin/customers', label: '顧客管理', icon: '👥' },
  { href: '/admin/reports', label: '報表列表', icon: '📊' },
  { href: '/admin/settings', label: '商家設定', icon: '⚙' },
  { href: '/admin/announcements', label: '公告列表', icon: '📢' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>('/admin/appointments');

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login'); return; }
      r.json().then(d => {
        if (d.user.role === 'customer') { router.replace('/customer'); return; }
        setUser(d.user);
      });
    });
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: '#2C2420' }}>
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#8B7355' }}>美</div>
        <span className="text-white font-semibold text-lg">美甲</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(item => {
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
                <span className="w-5 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.children && <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>}
              </button>
              {item.children && isExpanded && (
                <div style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {item.children.map(child => (
                    <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                      className={`block pl-12 pr-4 py-2 text-sm transition-colors ${pathname === child.href ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
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
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: '#8B7355' }}>
              {user.name[0].toUpperCase()}
            </div>
            <span className="text-white text-sm">{user.name}</span>
          </div>
        )}
        <button onClick={logout} className="w-full py-2 text-sm text-gray-400 hover:text-white text-left transition-colors">登出</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8F5F0' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-48 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: '#8B7355' }}>
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
