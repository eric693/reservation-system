'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch('/api/store-settings').then(r => r.json()).then(setSettings); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await fetch('/api/store-settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-800">商家設定</h1>
      <form onSubmit={save} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">店家名稱</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.store_name || ''} onChange={e => set('store_name', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Logo 文字</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" maxLength={2} placeholder="美" value={settings.logo_text || ''} onChange={e => set('logo_text', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">首頁 Banner 圖片 URL</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" placeholder="https://images.unsplash.com/..." value={settings.banner_url || ''} onChange={e => set('banner_url', e.target.value)} />
          {settings.banner_url && <img src={settings.banner_url} className="mt-2 h-24 w-full object-cover rounded-lg bg-gray-100" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} alt="banner preview" />}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">地址</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.address || ''} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">電話</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">開店時間</label>
            <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.open_time || '09:00'} onChange={e => set('open_time', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">關店時間</label>
            <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-600" value={settings.close_time || '21:00'} onChange={e => set('close_time', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">時段間隔（分）</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" value={settings.slot_interval || '30'} onChange={e => set('slot_interval', e.target.value)}>
              <option value="30">30 分鐘</option>
              <option value="60">60 分鐘</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={loading} className="px-6 py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>
            {loading ? '儲存中...' : '儲存設定'}
          </button>
          {saved && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              已儲存
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
