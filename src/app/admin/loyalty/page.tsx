'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export default function LoyaltyPage() {
  const [settings, setSettings] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [adjustForm, setAdjustForm] = useState({ points: '', description: '' });
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchSettings = () =>
    fetch('/api/loyalty/settings').then(r => r.json()).then(d => { setSettings(d); setSettingsForm(d); });

  const fetchCustomers = () =>
    fetch('/api/customers?limit=200').then(r => r.json()).then(d => setCustomers(d.customers || []));

  useEffect(() => { fetchSettings(); fetchCustomers(); }, []);

  const openCustomer = async (c: any) => {
    setSelected(c);
    setAdjustForm({ points: '', description: '' });
    const d = await fetch(`/api/loyalty?userId=${c.id}`).then(r => r.json());
    setBalance(d.balance || 0);
    setHistory(d.history || []);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.points) return;
    setLoading(true);
    const res = await fetch('/api/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selected.id, points: Number(adjustForm.points), description: adjustForm.description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast(data.error || '操作失敗', 'error'); return; }
    toast('積分已調整', 'success');
    setBalance(data.balance);
    setAdjustForm({ points: '', description: '' });
    openCustomer(selected);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/loyalty/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm),
    });
    setLoading(false);
    if (res.ok) { toast('設定已儲存', 'success'); fetchSettings(); }
    else toast('儲存失敗', 'error');
  };

  const TYPE_LABELS: Record<string, string> = { earn: '獲得', redeem: '兌換', adjust: '調整', expire: '過期' };
  const TYPE_COLORS: Record<string, string> = { earn: '#10B981', redeem: '#EF4444', adjust: '#3B82F6', expire: '#9CA3AF' };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-800">積分管理</h1>

      {/* Settings */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">積分規則設定</h2>
        {settingsForm && (
          <form onSubmit={saveSettings} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">消費 $1 獲得點數</label>
              <input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                value={settingsForm.earn_rate} onChange={e => setSettingsForm((s: any) => ({ ...s, earn_rate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">1 點折抵金額（$）</label>
              <input type="number" step="0.001" min="0.001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                value={settingsForm.redeem_rate} onChange={e => setSettingsForm((s: any) => ({ ...s, redeem_rate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">最低兌換點數</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                value={settingsForm.min_redeem} onChange={e => setSettingsForm((s: any) => ({ ...s, min_redeem: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">點數有效天數</label>
              <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                value={settingsForm.expiry_days} onChange={e => setSettingsForm((s: any) => ({ ...s, expiry_days: e.target.value }))} />
            </div>
            <div className="col-span-full">
              <button type="submit" disabled={loading} className="px-5 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>儲存設定</button>
              {settings && (
                <span className="ml-4 text-xs text-gray-400">
                  目前：消費 $1 獲 {settings.earn_rate} 點，{settings.min_redeem} 點起兌，1 點 = ${settings.redeem_rate}
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer list */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">顧客積分總覽</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {customers.map(c => (
              <button key={c.id} onClick={() => openCustomer(c)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left ${selected?.id === c.id ? 'bg-amber-50' : ''}`}>
                <div>
                  <div className="text-sm font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.phone}</div>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {c.loyalty_balance ?? '—'} 點
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer detail */}
        {selected ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-800">{selected.name}</div>
                  <div className="text-xs text-gray-400">{selected.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{balance}</div>
                  <div className="text-xs text-gray-400">目前積分</div>
                </div>
              </div>
              <form onSubmit={submitAdjust} className="flex gap-2">
                <input type="number" placeholder="點數（負數為扣除）" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={adjustForm.points} onChange={e => setAdjustForm(f => ({ ...f, points: e.target.value }))} required />
                <input placeholder="原因" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={adjustForm.description} onChange={e => setAdjustForm(f => ({ ...f, description: e.target.value }))} />
                <button type="submit" disabled={loading} className="px-3 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>調整</button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">積分紀錄</div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {history.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">尚無紀錄</div>}
                {history.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium" style={{ color: TYPE_COLORS[h.type] || '#6B7280' }}>
                        {TYPE_LABELS[h.type] || h.type}
                      </div>
                      <div className="text-xs text-gray-400">{h.description} · {h.created_at?.slice(0, 10)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: h.points > 0 ? '#10B981' : '#EF4444' }}>
                        {h.points > 0 ? '+' : ''}{h.points}
                      </div>
                      <div className="text-xs text-gray-400">餘 {h.balance_after}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm flex items-center justify-center text-gray-400 text-sm">
            點擊左側顧客查看積分詳情
          </div>
        )}
      </div>
    </div>
  );
}
