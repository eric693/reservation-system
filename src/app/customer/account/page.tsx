'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setUser(d.user); setProfileForm({ name: d.user.name, phone: d.user.phone || '' }); }
    });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setProfileLoading(true); setProfileMsg('');
    const res = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) });
    const data = await res.json();
    setProfileLoading(false);
    if (!res.ok) { setProfileMsg(data.error || '更新失敗'); return; }
    setProfileMsg('已更新'); setUser((u: any) => ({ ...u, name: data.name }));
    setTimeout(() => setProfileMsg(''), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdMsg('');
    if (pwdForm.new_password !== pwdForm.confirm_password) { setPwdMsg('兩次密碼不一致'); return; }
    setPwdLoading(true);
    const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }) });
    const data = await res.json();
    setPwdLoading(false);
    if (!res.ok) { setPwdMsg(data.error || '修改失敗'); return; }
    setPwdMsg('密碼已更新'); setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    setTimeout(() => setPwdMsg(''), 2000);
  };

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer/profile" className="text-gray-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="font-semibold text-gray-800">帳號設定</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ background: '#8B7355' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{user?.name}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={saveProfile} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">個人資料</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">姓名</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600"
              value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">電話</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600"
              value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Email（不可修改）</label>
            <input className="w-full border border-gray-100 rounded-xl px-3 py-3 text-sm bg-gray-50 text-gray-400" value={user?.email || ''} disabled />
          </div>
          {profileMsg && <p className={`text-sm ${profileMsg === '已更新' ? 'text-green-600' : 'text-red-500'}`}>{profileMsg}</p>}
          <button type="submit" disabled={profileLoading} className="w-full py-3 text-white rounded-2xl text-sm font-semibold" style={{ background: '#8B7355', opacity: profileLoading ? 0.7 : 1 }}>
            {profileLoading ? '更新中...' : '儲存變更'}
          </button>
        </form>

        {/* Password form */}
        <form onSubmit={changePassword} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">修改密碼</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">目前密碼</label>
            <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600"
              value={pwdForm.current_password} onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">新密碼（至少 6 位）</label>
            <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600"
              value={pwdForm.new_password} onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">確認新密碼</label>
            <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600"
              value={pwdForm.confirm_password} onChange={e => setPwdForm(f => ({ ...f, confirm_password: e.target.value }))} required />
          </div>
          {pwdMsg && <p className={`text-sm ${pwdMsg === '密碼已更新' ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg}</p>}
          <button type="submit" disabled={pwdLoading} className="w-full py-3 rounded-2xl text-sm font-semibold border-2 transition-colors" style={{ borderColor: '#8B7355', color: '#8B7355', opacity: pwdLoading ? 0.7 : 1 }}>
            {pwdLoading ? '更新中...' : '修改密碼'}
          </button>
        </form>
      </div>
    </div>
  );
}
