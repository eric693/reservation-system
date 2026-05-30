'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconX } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'percent', value: 10, min_amount: 0, max_uses: 0, valid_from: '', valid_until: '', service_id: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchCoupons = () => fetch('/api/coupons').then(r => r.json()).then(setCoupons);
  useEffect(() => { fetchCoupons(); fetch('/api/services').then(r => r.json()).then(setServices); }, []);

  const openNew = () => { setEditItem(null); setForm({ code: '', name: '', type: 'percent', value: 10, min_amount: 0, max_uses: 0, valid_from: '', valid_until: '', service_id: '' }); setShowForm(true); };
  const openEdit = (c: any) => { setEditItem(c); setForm({ code: c.code, name: c.name, type: c.type, value: c.value, min_amount: c.min_amount, max_uses: c.max_uses, valid_from: c.valid_from || '', valid_until: c.valid_until || '', service_id: c.service_id || '' }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const url = editItem ? `/api/coupons/${editItem.id}` : '/api/coupons';
    const method = editItem ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast(data.error || '操作失敗', 'error'); return; }
    toast(editItem ? '已更新' : '已新增', 'success'); setShowForm(false); fetchCoupons();
  };

  const toggleActive = async (id: number, is_active: number) => {
    await fetch(`/api/coupons/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: is_active ? 0 : 1 }) });
    toast(is_active ? '已停用' : '已啟用', 'success'); fetchCoupons();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">優惠券管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">折扣碼、滿額折抵，提升預約轉換率</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>
          <IconPlus size={16} color="white" /> 新增優惠券
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => {
          const isExpired = c.valid_until && c.valid_until < today;
          const isFull = c.max_uses > 0 && c.used_count >= c.max_uses;
          return (
            <div key={c.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${!c.is_active || isExpired || isFull ? 'opacity-60 border-gray-100' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono font-bold text-lg tracking-widest" style={{ color: '#8B7355' }}>{c.code}</div>
                  <div className="text-sm text-gray-600">{c.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                    {c.type === 'percent' ? `-${c.value}%` : `-NT$${c.value}`}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                {c.min_amount > 0 && <div>最低消費 NT$ {c.min_amount.toLocaleString()}</div>}
                {c.max_uses > 0 && <div>已使用 {c.used_count} / {c.max_uses} 次</div>}
                {c.valid_until && <div>有效期至 {c.valid_until}</div>}
                {c.service_name && <div>限用：{c.service_name}</div>}
              </div>
              <div className="flex items-center gap-2">
                {isExpired && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">已過期</span>}
                {isFull && <span className="text-xs bg-red-100 text-red-400 px-2 py-0.5 rounded-full">已額滿</span>}
                {!isExpired && !isFull && <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{c.is_active ? '啟用中' : '已停用'}</span>}
                <div className="ml-auto flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"><IconEdit size={13} color="#6B7280" /></button>
                  <button onClick={() => toggleActive(c.id, c.is_active)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">{c.is_active ? '停用' : '啟用'}</button>
                </div>
              </div>
            </div>
          );
        })}
        {coupons.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">尚無優惠券</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯優惠券' : '新增優惠券'}</h3>
              <button onClick={() => setShowForm(false)}><IconX size={20} color="#9CA3AF" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {!editItem && <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600 font-mono uppercase" placeholder="優惠碼（英數字）*" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />}
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="名稱 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">折扣類型</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="percent">百分比 (%)</option>
                    <option value="fixed">固定金額 (NT$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{form.type === 'percent' ? '折扣 %' : '折抵 NT$'}</label>
                  <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">最低消費 NT$</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">使用上限（0=無限）</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">開始日期</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">結束日期</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">限定服務（選填）</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}>
                  <option value="">適用所有服務</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : '儲存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
