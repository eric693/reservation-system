'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomerHome() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/store-settings').then(r => r.json()).then(setSettings);
    fetch('/api/announcements').then(r => r.json()).then(setAnnouncements);
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d.user));
  }, []);

  const BANNER_IMG = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=400&fit=crop';

  return (
    <div>
      {/* Banner */}
      <div className="relative" style={{ height: '240px', overflow: 'hidden' }}>
        <img src={BANNER_IMG} alt="banner" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.background = '#D4C5B0'; }} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="p-4 space-y-4">
        {/* Book now CTA */}
        <Link href="/customer/booking" className="block w-full py-4 rounded-2xl text-white text-center font-semibold text-lg shadow-lg" style={{ background: '#8B7355' }}>
          📅 立即預約
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/customer/my-appointments" className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm hover:shadow">
            <span className="text-3xl">📋</span>
            <span className="text-sm font-medium text-gray-700">我的預約</span>
          </Link>
          <Link href="/customer/services" className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm hover:shadow">
            <span className="text-3xl">✂</span>
            <span className="text-sm font-medium text-gray-700">服務項目</span>
          </Link>
        </div>

        {/* Store info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: '#8B7355' }}>美</div>
            <h2 className="font-semibold text-gray-800">店家資訊</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            {settings.address && <div className="flex items-start gap-2"><span>📍</span><span>{settings.address}</span></div>}
            {settings.phone && <div className="flex items-center gap-2"><span>📞</span><a href={`tel:${settings.phone}`} className="text-blue-600">{settings.phone}</a></div>}
            {settings.email && <div className="flex items-center gap-2"><span>✉</span><span>{settings.email}</span></div>}
          </div>
        </div>

        {/* Booking process */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">預約流程</h2>
          <div className="flex items-center justify-between">
            {[
              { icon: '✂', label: '選擇服務' },
              { icon: '👤', label: '選擇設計師' },
              { icon: '🕐', label: '選擇時間' },
              { icon: '✓', label: '確認預約' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2" style={{ borderColor: '#8B7355' }}>
                  {step.icon}
                </div>
                <span className="text-xs text-gray-500 text-center">{step.label}</span>
                {i < 3 && <div className="absolute" style={{ display: 'none' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-800">最新消息</h2>
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-medium text-sm">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
