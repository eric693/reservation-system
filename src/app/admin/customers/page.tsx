'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconX } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'appointment_count' | 'total_spent'>('created_at');
  const [filterVip, setFilterVip] = useState(false);
  const [filterTag, setFilterTag] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [selectedApts, setSelectedApts] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedLoyalty, setSelectedLoyalty] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#6B7280' });
  const [showTagManager, setShowTagManager] = useState(false);
  const toast = useToast();

  const fetchCustomers = () =>
    fetch(`/api/customers?limit=200&search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d : (d.customers || [])));

  const fetchTags = () => fetch('/api/tags').then(r => r.json()).then(setTags);

  useEffect(() => { fetchCustomers(); }, [search]);
  useEffect(() => { fetchTags(); }, []);

  const filtered = customers
    .filter(c => !filterVip || c.is_vip)
    .filter(c => !filterTag || (c.tag_ids || []).includes(filterTag))
    .sort((a, b) => {
      if (sortBy === 'appointment_count') return b.appointment_count - a.appointment_count;
      if (sortBy === 'total_spent') return (b.total_spent || 0) - (a.total_spent || 0);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

  const openDetail = async (c: any) => {
    setSelected(c); setEditNotes(c.notes || '');
    const [aptsRes, tagsRes, loyaltyRes] = await Promise.all([
      fetch('/api/appointments?limit=100').then(r => r.json()),
      fetch(`/api/customers/${c.id}/tags`).then(r => r.json()),
      fetch(`/api/loyalty?userId=${c.id}`).then(r => r.ok ? r.json() : { balance: 0 }),
    ]);
    const apts = Array.isArray(aptsRes) ? aptsRes : (aptsRes.appointments || []);
    setSelectedApts(apts.filter((a: any) => a.customer_user_id === c.id));
    setSelectedTags(Array.isArray(tagsRes) ? tagsRes.map((t: any) => t.id) : []);
    setSelectedLoyalty(loyaltyRes.balance ?? 0);
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
    toast('備註已儲存', 'success');
  };

  const saveTags = async () => {
    if (!selected) return;
    await fetch(`/api/customers/${selected.id}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag_ids: selectedTags }) });
    toast('標籤已更新', 'success');
    fetchCustomers();
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTag) });
    const data = await res.json();
    if (!res.ok) { toast(data.error || '建立失敗', 'error'); return; }
    toast('標籤已建立', 'success');
    setNewTag({ name: '', color: '#6B7280' });
    fetchTags();
  };

  const deleteTag = async (id: number) => {
    if (!confirm('確定刪除此標籤？所有顧客的此標籤都會移除')) return;
    await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    fetchTags(); fetchCustomers();
    toast('標籤已刪除', 'success');
  };

  const exportCSV = () => {
    const rows = [['姓名', '電話', 'Email', '預約次數', '消費總額', '最近到訪', '加入時間']];
    filtered.forEach(c => rows.push([c.name, c.phone || '', c.email, c.appointment_count, c.total_spent || 0, c.last_visit || '', c.created_at?.slice(0, 10)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = '顧客名單.csv'; a.click();
  };

  const TAG_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#6B7280', '#14B8A6'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">顧客管理</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-400 self-center">共 {filtered.length} 位</span>
          <button onClick={() => setShowTagManager(true)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">管理標籤</button>
          <button onClick={exportCSV} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">匯出 CSV</button>
        </div>
      </div>

      {/* Filters */}
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
          style={filterVip ? { background: '#F59E0B' } : {}}>VIP</button>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterTag ?? ''} onChange={e => setFilterTag(e.target.value ? Number(e.target.value) : null)}>
          <option value="">全部標籤</option>
          {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setSortBy('created_at'); setFilterVip(false); setFilterTag(null); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">顧客</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">聯絡方式</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">預約 / 消費</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">最近到訪</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暫無顧客資料</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: 'var(--primary)' }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{c.name}</span>
                          {c.is_vip === 1 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}>VIP</span>}
                        </div>
                        {c.notes && <div className="text-xs text-gray-400 truncate max-w-[140px]">{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="text-gray-700">{c.phone}</div><div className="text-xs text-gray-400">{c.email}</div></td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: 'var(--primary)' }}>{c.appointment_count}</span>
                    <span className="text-gray-400"> 次 · </span>
                    <span className="text-gray-700">NT${(c.total_spent || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.last_visit || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDetail(c)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">詳情</button>
                      <button onClick={() => toggleVip(c.id, c.is_vip)}
                        className={`px-2 py-1 text-xs rounded border ${c.is_vip ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {c.is_vip ? '取消VIP' : '設VIP'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--primary)' }}>{selected.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{selected.name}</h3>
                    {selected.is_vip === 1 && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}>VIP</span>}
                  </div>
                  <p className="text-sm text-gray-500">{selected.phone} · {selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: '總預約', value: selected.appointment_count, color: 'var(--primary)' },
                { label: '消費總額', value: `$${((selected.total_spent || 0) / 1000).toFixed(1)}K`, color: '#10B981' },
                { label: '待到來', value: selectedApts.filter(a => ['pending','confirmed','checkedin'].includes(a.status)).length, color: '#3B82F6' },
                { label: '積分', value: selectedLoyalty, color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="font-bold text-base" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">顧客標籤</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <button key={t.id} onClick={() => setSelectedTags(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all"
                    style={selectedTags.includes(t.id) ? { background: t.color, color: 'white', borderColor: t.color } : { borderColor: t.color, color: t.color }}>
                    {t.name}
                  </button>
                ))}
              </div>
              <button onClick={saveTags} className="px-3 py-1 text-xs text-white rounded-lg" style={{ background: 'var(--primary)' }}>儲存標籤</button>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1 block">內部備註</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" rows={2}
                placeholder="紀錄顧客喜好、過敏史等..." value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              <button onClick={saveNote} disabled={savingNote} className="mt-1 px-3 py-1 text-xs text-white rounded-lg" style={{ background: 'var(--primary)', opacity: savingNote ? 0.7 : 1 }}>
                {savingNote ? '儲存中...' : '儲存備註'}
              </button>
            </div>

            <h4 className="font-semibold text-sm text-gray-700 mb-2">預約記錄（最近 10 筆）</h4>
            <div className="space-y-1">
              {selectedApts.slice(0, 10).map(a => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <div><span className="font-medium text-gray-700">{a.service_name}</span><span className="text-gray-400 ml-2 text-xs">{a.staff_name}</span></div>
                  <div className="text-xs text-gray-500">{a.date} {a.start_time}</div>
                </div>
              ))}
              {selectedApts.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">無預約記錄</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tag manager modal */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTagManager(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">管理顧客標籤</h3>
              <button onClick={() => setShowTagManager(false)} className="text-gray-400 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={createTag} className="flex gap-2 mb-4">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="標籤名稱" value={newTag.name} onChange={e => setNewTag(t => ({ ...t, name: e.target.value }))} required />
              <div className="flex gap-1 flex-wrap w-24">
                {TAG_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewTag(t => ({ ...t, color: c }))}
                    className="w-5 h-5 rounded-full border-2 transition-all"
                    style={{ background: c, borderColor: newTag.color === c ? '#1F2937' : 'transparent' }} />
                ))}
              </div>
              <button type="submit" className="px-3 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>新增</button>
            </form>
            <div className="space-y-2">
              {tags.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: t.color }}>{t.name}</span>
                  <button onClick={() => deleteTag(t.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">刪除</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
