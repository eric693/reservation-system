'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconScissors, IconImage, IconChevronRight, IconUser } from '@/components/ui/Icons';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d.user));
    fetch('/api/appointments').then(r => r.json()).then(setAppointments);
    fetch('/api/loyalty').then(r => r.ok ? r.json() : null).then(d => d && setLoyaltyBalance(d.balance ?? 0));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const completed = appointments.filter(a => a.status === 'completed').length;
  const upcoming = appointments.filter(a => ['pending','confirmed','checkedin'].includes(a.status)).length;

  return (
    <div>
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="font-semibold text-gray-800 text-center">我的</h1>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: 'var(--primary)' }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-bold text-lg">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{completed}</div>
              <div className="text-xs text-gray-400">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{upcoming}</div>
              <div className="text-xs text-gray-400">即將到來</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{loyaltyBalance ?? '—'}</div>
              <div className="text-xs text-gray-400">積分</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { href: '/customer/my-appointments', Icon: IconCalendar, label: '我的預約' },
            { href: '/customer/services', Icon: IconScissors, label: '服務項目' },
            { href: '/customer/portfolio', Icon: IconImage, label: '作品集' },
            { href: '/customer/account', Icon: IconUser, label: '帳號設定' },
          ].map(({ href, Icon, label }) => (
            <Link key={href} href={href} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
              <Icon size={20} color="var(--primary)" />
              <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
              <IconChevronRight size={16} color="#D1D5DB" />
            </Link>
          ))}
        </div>

        <button onClick={logout} className="w-full py-4 bg-white rounded-2xl shadow-sm text-red-500 font-medium text-sm">
          登出
        </button>
      </div>
    </div>
  );
}
