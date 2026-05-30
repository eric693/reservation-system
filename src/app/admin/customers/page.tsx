'use client';
import { useState, useEffect } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetch('/api/customers').then(r => r.json()).then(setCustomers); }, []);

  const filtered = customers.filter(c =>
    c.name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">顧客管理</h1>
        <div className="text-sm text-gray-400">共 {customers.length} 位顧客</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <input className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="搜尋姓名/電話/Email" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">顧客</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">聯絡方式</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">預約次數</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">最近到訪</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">加入時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暫無顧客資料</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: '#8B7355' }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div>{c.phone}</div><div className="text-xs text-gray-400">{c.email}</div></td>
                  <td className="px-4 py-3"><span className="font-semibold" style={{ color: '#8B7355' }}>{c.appointment_count}</span> 次</td>
                  <td className="px-4 py-3">{c.last_visit || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.created_at?.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
