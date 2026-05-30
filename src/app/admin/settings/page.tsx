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
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }));

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-800">商家設定</h1>
      <form onSubmit={save} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">店家名稱</label>
          <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.store_name || ''} onChange={e => set('store_name', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">地址</label>
          <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.address || ''} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">電話</label>
            <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">開店時間</label>
            <input type="time" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.open_time || '09:00'} onChange={e => set('open_time', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">關店時間</label>
            <input type="time" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.close_time || '21:00'} onChange={e => set('close_time', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">時段間隔 (分鐘)</label>
            <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={settings.slot_interval || '30'} onChange={e => set('slot_interval', e.target.value)}>
              <option value="30">30</option><option value="60">60</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-6 py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
            {loading ? '儲存中...' : '儲存設定'}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ 已儲存</span>}
        </div>
      </form>
    </div>
  );
}
