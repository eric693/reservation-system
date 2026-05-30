'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconEdit, IconX } from '@/components/ui/Icons';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'appointment_count' | 'total_spent'>('created_at');
  const [filterVip, setFilterVip] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [selectedApts, setSelectedApts] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomers = () => fetch('/api/customers').then(r => r.json()).then(setCustomers);
  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers
    .filter(c =>
      (!filterVip || c.is_vip) &&
      (!search || c.name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search))
    )
    .sort((a, b) => {
      if (sortBy === 'appointment_count') return b.appointment_count - a.appointment_count;
      if (sortBy === 'total_spent') return (b.total_spent || 0) - (a.total_spent || 0);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

  const openDetail = async (c: any) => {
    setSelected(c); setEditNotes(c.notes || '');
    const apts = await fetch('/api/appointments').then(r => r.json());
    setSelectedApts(apts.filter((a: any) => a.customer_user_id === c.id));
  };

  const toggleVip = async (id: number, current: number) => {
    await fetch(`/api/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_vip: current ? 0 : 1 }) });
    fetchCustomers();
    if (selected?.id === id) setSelected((s: any) => ({ ...s, is_vip: current ? 0 : 1 }));
  };

  const saveNote = async () => {
    if (!selected) return; setSavingNote(true);
    await fetch(`/api/customers/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: editNotes }) });
    setSavingNote(false); fetchCustomers();
    setSelected((s: any) => ({ ...s, notes: editNotes }));
  };

  const exportCSV = () => {
    const rows = [['姓名','電話','Email','預約次數','消費總額','最近到訪','加入時間']];
    filtered.forEach(c => rows.push([c.name, c.phone || '', c.email, c.appointment_count, c.total_spent || 0, c.last_visit || '', c.created_at?.slice(0,10)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = '顧客名單.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">顧客管理</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400 self-center">共 {filtered.length} 位</span>
          <button onClick={exportCSV} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">匯出 CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-48" style={{ paddingLeft: '28px', paddingRight: '12px' }}
            placeholder="搜尋姓名/電話/Email" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="created_at">依加入時間</option>
          <option value="appointment_count">依預約次數</option>
          <option value="total_spent">依消費金額</option>
        </select>
        <button onClick={() => setFilterVip(!filterVip)} className={`px-3 py-2 text-sm rounded-lg border transition-colors ${filterVip ? 'text-white border-transparent' : 'border-gray-200 hover:bg-gray-50'}`}
          style={filterVip ? { background: '#F59E0B', borderColor: '#F59E0B' } : {}}>
          VIP 顧客
        </button>
        <button onClick={() => { setSearch(''); setSortBy('created_at'); setFilterVip(false); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">顧客</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">聯絡方式</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">預約次數</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">消費總額</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">最近到訪</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暫無顧客資料</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: '#8B7355' }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{c.name}</span>
                          {c.is_vip === 1 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>VIP</span>}
                        </div>
                        {c.notes && <div className="text-xs text-gray-400 truncate max-w-[120px]">{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="text-gray-700">{c.phone}</div><div className="text-xs text-gray-400">{c.email}</div></td>
                  <td className="px-4 py-3"><span className="font-semibold" style={{ color: '#8B7355' }}>{c.appointment_count}</span> 次</td>
                  <td className="px-4 py-3 text-gray-700">NT$ {(c.total_spent || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{c.last_visit || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDetail(c)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">詳情</button>
                      <button onClick={() => toggleVip(c.id, c.is_vip)}
                        className={`px-2 py-1 text-xs rounded border ${c.is_vip ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {c.is_vip ? '取消VIP' : '設為VIP'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: '#8B7355' }}>{selected.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{selected.name}</h3>
                    {selected.is_vip === 1 && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>VIP</span>}
                  </div>
                  <p className="text-sm text-gray-500">{selected.phone} · {selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400">
                <IconX size={20} color="#9CA3AF" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="font-bold text-lg" style={{ color: '#8B7355' }}>{selected.appointment_count}</div>
                <div className="text-xs text-gray-400">總預約</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="font-bold text-base text-green-600">NT$ {((selected.total_spent || 0) / 1000).toFixed(1)}K</div>
                <div className="text-xs text-gray-400">消費總額</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="font-bold text-lg" style={{ color: '#3B82F6' }}>{selectedApts.filter(a => ['pending','confirmed','checkedin'].includes(a.status)).length}</div>
                <div className="text-xs text-gray-400">待到來</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">內部備註</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" rows={2}
                placeholder="紀錄顧客喜好、過敏史等..." value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              <button onClick={saveNote} disabled={savingNote} className="mt-1 px-3 py-1 text-xs text-white rounded-lg" style={{ background: '#8B7355', opacity: savingNote ? 0.7 : 1 }}>
                {savingNote ? '儲存中...' : '儲存備註'}
              </button>
            </div>

            <h4 className="font-semibold text-sm text-gray-700 mb-2">預約記錄（最近 10 筆）</h4>
            <div className="space-y-2">
              {selectedApts.slice(0, 10).map(a => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <div><span className="font-medium text-gray-700">{a.service_name}</span><span className="text-gray-400 ml-2 text-xs">{a.staff_name}</span></div>
                  <div className="text-right text-xs text-gray-500">{a.date} {a.start_time}</div>
                </div>
              ))}
              {selectedApts.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">無預約記錄</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
