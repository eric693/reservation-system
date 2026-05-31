'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconMapPin, IconPhone, IconMail, IconScissors, IconUser, IconClock, IconCheck, IconCalendar, IconList } from '@/components/ui/Icons';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', checkedin: '#10B981', completed: '#8B5CF6'
};
const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', checkedin: '已到店', completed: '已完成'
};

export default function CustomerHome() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingApts, setUpcomingApts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/store-settings').then(r => r.json()).then(setSettings);
    fetch('/api/announcements').then(r => r.json()).then(setAnnouncements);
    // Load upcoming appointments
    fetch('/api/appointments').then(r => r.ok ? r.json() : []).then(apts => {
      const upcoming = apts.filter((a: any) => ['pending','confirmed','checkedin'].includes(a.status))
        .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
        .slice(0, 2);
      setUpcomingApts(upcoming);
    });
  }, []);

  return (
    <div>
      {/* Banner — URL from store_settings.banner_url */}
      <div className="relative" style={{ height: '240px', overflow: 'hidden', background: 'var(--primary-warm)' }}>
        {settings.banner_url && (
          <img src={settings.banner_url} alt="banner" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="p-4 space-y-4">
        <Link href="/customer/booking" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg" style={{ background: 'var(--primary)' }}>
          <IconCalendar size={20} color="white" />
          立即預約
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/customer/my-appointments" className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm">
            <IconList size={28} color="var(--primary)" />
            <span className="text-sm font-medium text-gray-700">我的預約</span>
          </Link>
          <Link href="/customer/services" className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm">
            <IconScissors size={28} color="var(--primary)" />
            <span className="text-sm font-medium text-gray-700">服務項目</span>
          </Link>
        </div>

        {/* Upcoming appointments */}
        {upcomingApts.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">即將到來的預約</h2>
              <Link href="/customer/my-appointments" className="text-xs" style={{ color: 'var(--primary)' }}>查看全部</Link>
            </div>
            {upcomingApts.map(apt => (
              <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: STATUS_COLORS[apt.status] + '20' }}>
                  <IconCalendar size={18} color={STATUS_COLORS[apt.status]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{apt.service_name}</div>
                  <div className="text-xs text-gray-400">{apt.date} {apt.start_time} · {apt.staff_name}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[apt.status] + '20', color: STATUS_COLORS[apt.status] }}>
                  {STATUS_LABELS[apt.status]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Store info — all from API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'var(--primary)' }}>
              {settings.logo_text || settings.store_name?.[0] || '美'}
            </div>
            <h2 className="font-semibold text-gray-800">{settings.store_name || '店家資訊'}</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            {settings.address && (
              <div className="flex items-start gap-2">
                <IconMapPin size={15} color="var(--primary)" />
                <span>{settings.address}</span>
              </div>
            )}
            {settings.phone && (
              <div className="flex items-center gap-2">
                <IconPhone size={15} color="var(--primary)" />
                <a href={`tel:${settings.phone}`} className="text-blue-600">{settings.phone}</a>
              </div>
            )}
            {settings.email && (
              <div className="flex items-center gap-2">
                <IconMail size={15} color="var(--primary)" />
                <span>{settings.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">預約流程</h2>
          <div className="flex items-start justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 mx-8" />
            {[
              { Icon: IconScissors, label: '選擇服務' },
              { Icon: IconUser, label: '選擇設計師' },
              { Icon: IconClock, label: '選擇時間' },
              { Icon: IconCheck, label: '確認預約' },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1 relative z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2" style={{ borderColor: 'var(--primary)' }}>
                  <Icon size={18} color="var(--primary)" />
                </div>
                <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements — from API, pinned first */}
        {announcements.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-800">最新消息</h2>
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_pinned === 1 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}>置頂</span>}
                  <h3 className="font-medium text-sm text-gray-800">{a.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
