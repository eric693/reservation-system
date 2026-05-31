'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconX } from '@/components/ui/Icons';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSell, setShowSell] = useState<any>(null);
  const [sellCustomerId, setSellCustomerId] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', service_id: '', total_sessions: 5, bonus_sessions: 1, price: 0, valid_days: 365 });
  const [loading, setLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState('');

  const fetchPackages = () => fetch('/api/packages').then(r => r.json()).then(setPackages);
  useEffect(() => {
    fetchPackages();
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/customers?limit=500').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : (d.customers || [])));
  }, []);

  const openEdit = (p: any) => { setEditItem(p); setForm({ name: p.name, description: p.description || '', service_id: String(p.service_id || ''), total_sessions: p.total_sessions, bonus_sessions: p.bonus_sessions, price: p.price, valid_days: p.valid_days }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (editItem) {
      await fetch(`/api/packages/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setLoading(false); setShowForm(false); fetchPackages();
  };

  const sellPackage = async () => {
    if (!sellCustomerId) { setSellMsg('請選擇顧客'); return; }
    setLoading(true);
    const res = await fetch(`/api/packages/${showSell.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_user_id: Number(sellCustomerId) }) });
    setLoading(false);
    if (res.ok) { setSellMsg('售出成功！'); setTimeout(() => { setShowSell(null); setSellMsg(''); setSellCustomerId(''); }, 1500); }
    else { const d = await res.json(); setSellMsg(d.error || '操作失敗'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">套票管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">預付套票、買多送多，鎖定顧客回流</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '', service_id: '', total_sessions: 5, bonus_sessions: 1, price: 0, valid_days: 365 }); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>
          <IconPlus size={16} color="white" /> 新增套票
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-amber-200 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800">{p.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{p.service_name || '通用'}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3 min-h-[18px]">{p.description}</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-center flex-1 bg-gray-50 rounded-xl py-2">
                <div className="font-bold text-lg" style={{ color: 'var(--primary)' }}>{p.total_sessions}</div>
                <div className="text-xs text-gray-400">購買堂數</div>
              </div>
              {p.bonus_sessions > 0 && (
                <div className="text-center flex-1 bg-green-50 rounded-xl py-2">
                  <div className="font-bold text-lg text-green-600">+{p.bonus_sessions}</div>
                  <div className="text-xs text-gray-400">贈送堂數</div>
                </div>
              )}
              <div className="text-center flex-1 bg-gray-50 rounded-xl py-2">
                <div className="font-bold text-base text-gray-800">NT${(p.price/1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-400">售價</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-3">有效期：{p.valid_days} 天</div>
            <div className="flex gap-2">
              <button onClick={() => { setShowSell(p); setSellMsg(''); setSellCustomerId(''); }} className="flex-1 py-2 text-sm text-white rounded-xl font-medium" style={{ background: 'var(--primary)' }}>售出給顧客</button>
              <button onClick={() => openEdit(p)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
                <IconEdit size={14} color="#6B7280" />
              </button>
            </div>
          </div>
        ))}
        {packages.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">尚無套票</div>}
      </div>

      {/* Sell modal */}
      {showSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">售出套票</h3>
              <button onClick={() => setShowSell(null)}><IconX size={18} color="#9CA3AF" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <div className="font-medium">{showSell.name}</div>
              <div className="text-gray-500">{showSell.total_sessions + showSell.bonus_sessions} 堂 · NT$ {showSell.price.toLocaleString()}</div>
            </div>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none" value={sellCustomerId} onChange={e => setSellCustomerId(e.target.value)}>
              <option value="">選擇顧客</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone}</option>)}
            </select>
            {sellMsg && <p className={`text-sm mb-3 ${sellMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{sellMsg}</p>}
            <button onClick={sellPackage} disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>
              {loading ? '處理中...' : '確認售出'}
            </button>
          </div>
        </div>
      )}

      {/* Package form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯套票' : '新增套票'}</h3>
              <button onClick={() => setShowForm(false)}><IconX size={20} color="#9CA3AF" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="套票名稱 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="說明" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}>
                <option value="">適用所有服務</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">購買堂數</label><input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.total_sessions} onChange={e => setForm(f => ({ ...f, total_sessions: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">贈送堂數</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.bonus_sessions} onChange={e => setForm(f => ({ ...f, bonus_sessions: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">有效天數</label><input type="number" min="30" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.valid_days} onChange={e => setForm(f => ({ ...f, valid_days: Number(e.target.value) }))} /></div>
              </div>
              <div><label className="text-xs text-gray-500 block mb-1">售價（NT$）</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required /></div>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>{loading ? '儲存中...' : '儲存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
