'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '操作失敗'); return; }
    if (data.user.role === 'customer') router.replace('/customer');
    else router.replace('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #EDE8E0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3" style={{ background: '#8B7355' }}>美</div>
          <h1 className="text-2xl font-bold" style={{ color: '#8B7355' }}>美甲預約系統</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                {t === 'login' ? '登入' : '註冊'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-yellow-700" placeholder="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-yellow-700" placeholder="電話" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </>
            )}
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-yellow-700" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-yellow-700" placeholder="密碼 *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-medium text-sm transition-opacity" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
              {loading ? '處理中...' : (tab === 'login' ? '登入' : '註冊')}
            </button>
          </form>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium mb-1">測試帳號：</p>
            <p>管理員：admin@salon.com / admin123</p>
            <p>顧客：customer@salon.com / customer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
