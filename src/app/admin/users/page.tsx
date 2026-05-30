'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconEdit, IconTrash, IconX } from '@/components/ui/Icons';

const ROLE_LABELS: Record<string, string> = { admin: '管理員', staff: '設計師', customer: '顧客' };
const ROLE_COLORS: Record<string, string> = { admin: '#8B5CF6', staff: '#3B82F6', customer: '#10B981' };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', role: '', is_vip: 0, notes: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showPwdField, setShowPwdField] = useState(false);

  const fetchUsers = () => fetch('/api/users').then(r => r.json()).then(setUsers);
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    (!filterRole || u.role === filterRole) &&
    (!search || u.name?.includes(search) || u.email?.includes(search) || u.phone?.includes(search))
  );

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, phone: u.phone || '', role: u.role, is_vip: u.is_vip || 0, notes: u.notes || '', new_password: '' });
    setMsg(''); setShowPwdField(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg('');
    const payload: any = { name: form.name, phone: form.phone, role: form.role, is_vip: form.is_vip, notes: form.notes };
    if (form.new_password) payload.new_password = form.new_password;
    const res = await fetch(`/api/users/${editUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error || '操作失敗'); return; }
    setMsg('已儲存'); fetchUsers();
    setTimeout(() => { setEditUser(null); setMsg(''); }, 800);
  };

  const disable = async (id: number) => {
    if (!confirm('確定要停用此帳號嗎？')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchUsers();
  };

  const counts = { all: users.length, admin: users.filter(u => u.role === 'admin').length, staff: users.filter(u => u.role === 'staff').length, customer: users.filter(u => u.role === 'customer').length };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">帳號管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">管理所有使用者帳號、角色與權限</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '全部', value: counts.all, color: '#6B7280' },
          { label: '管理員', value: counts.admin, color: '#8B5CF6' },
          { label: '設計師', value: counts.staff, color: '#3B82F6' },
          { label: '顧客', value: counts.customer, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterRole(s.label === '全部' ? '' : Object.keys(ROLE_LABELS).find(k => ROLE_LABELS[k] === s.label) || '')}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-48" style={{ paddingLeft: '28px', paddingRight: '12px' }}
            placeholder="搜尋姓名/Email/電話" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">全部角色</option>
          <option value="admin">管理員</option>
          <option value="staff">設計師</option>
          <option value="customer">顧客</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterRole(''); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">帳號</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">角色</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">聯絡方式</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">加入時間</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暫無資料</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: ROLE_COLORS[u.role] || '#8B7355' }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{u.name}</span>
                          {u.is_vip === 1 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>VIP</span>}
                          {u.username && <span className="text-xs text-gray-400">@{u.username}</span>}
                        </div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role] }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                        <IconEdit size={12} color="#6B7280" /> 編輯
                      </button>
                      <button onClick={() => disable(u.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-red-100 rounded-lg hover:bg-red-50 text-red-500">
                        <IconTrash size={12} color="#EF4444" /> 停用
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-lg">編輯帳號</h3>
                <p className="text-sm text-gray-400">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)}><IconX size={20} color="#9CA3AF" /></button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">姓名</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">電話</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">角色</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="admin">管理員</option>
                  <option value="staff">設計師</option>
                  <option value="customer">顧客</option>
                </select>
              </div>

              {form.role === 'customer' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.is_vip === 1} onChange={e => setForm(f => ({ ...f, is_vip: e.target.checked ? 1 : 0 }))} />
                  VIP 顧客
                </label>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">內部備註</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" rows={2}
                  placeholder="僅管理員可見" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowPwdField(!showPwdField)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {showPwdField ? '取消重設密碼' : '重設此帳號密碼'}
                </button>
                {showPwdField && (
                  <input type="password" className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    placeholder="新密碼（至少 6 位）" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} />
                )}
              </div>

              {msg && (
                <p className={`text-sm text-center font-medium ${msg === '已儲存' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '儲存中...' : '儲存變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
