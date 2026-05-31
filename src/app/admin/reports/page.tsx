'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const CHART_COLORS = ['var(--primary)', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#EF4444'];

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/reports/revenue').then(r => r.json()).then(d => { setRevenue(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  const kpis = revenue?.kpis || {};
  const monthly = (revenue?.monthlyRows || []).map((r: any) => ({
    ...r, label: r.month?.slice(5) + '月', revenue: r.revenue || 0
  }));
  const byCategory = revenue?.byCategory || [];
  const byStaff = revenue?.byStaff || [];
  const topServices = revenue?.topServices || [];
  const peakHours = Array.from({ length: 24 }, (_, h) => {
    const found = (revenue?.peakHours || []).find((r: any) => r.hour === h);
    return { hour: `${h}時`, count: found?.count || 0 };
  }).filter(h => h.count > 0 || (parseInt(h.hour) >= 9 && parseInt(h.hour) <= 21));
  const retention = revenue?.retention || {};

  const completionRate = kpis.total_appointments > 0
    ? Math.round((kpis.completed / kpis.total_appointments) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">營運報表</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">近 30 天 KPI · 即時更新</span>
          <a href="/api/export/appointments" download className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">匯出預約 CSV</a>
          <a href="/api/export/customers" download className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">匯出顧客 CSV</a>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="總收益" value={`NT$${((kpis.total_revenue || 0) / 1000).toFixed(1)}K`} sub="近 30 天完成" />
        <KpiCard label="完成預約" value={kpis.completed || 0} sub={`完成率 ${completionRate}%`} />
        <KpiCard label="平均客單價" value={`NT$${kpis.avg_ticket || 0}`} sub="已完成預約" />
        <KpiCard label="不重複顧客" value={kpis.unique_customers || 0} sub="近 30 天" />
        <KpiCard label="回頭客" value={retention.returning_customers || 0} sub={`新客 ${retention.new_customers || 0} 位`} />
      </div>

      {/* Monthly revenue trend */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">月度收益趨勢（近 12 個月）</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}K` : String(v)} />
            <Tooltip formatter={(v: any) => [`NT$${Number(v).toLocaleString()}`, '收益']} labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }} />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by category */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">服務類別收益佔比</h2>
          {byCategory.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">尚無資料</div>
          ) : (
            <div className="flex gap-6 items-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {byCategory.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`NT$${Number(v).toLocaleString()}`, '收益']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {byCategory.map((c: any, i: number) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-gray-700">{c.category}</span>
                    </div>
                    <span className="text-gray-500 text-xs">NT${(c.revenue / 1000).toFixed(1)}K</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Staff performance */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">設計師業績（近 90 天）</h2>
          {byStaff.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">尚無資料</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byStaff} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}K` : String(v)} />
                <YAxis dataKey="staff_name" type="category" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v: any) => [`NT$${Number(v).toLocaleString()}`, '收益']} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 space-y-1">
            {byStaff.map((s: any) => (
              <div key={s.staff_name} className="flex items-center justify-between text-xs text-gray-500">
                <span>{s.staff_name}</span>
                <span>{s.completed} 完成 · 均評 {s.avg_rating ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak hours */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">尖峰時段分析（歷史完成預約）</h2>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={peakHours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top services */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">服務項目業績排行</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="pb-2 text-left">服務</th>
                <th className="pb-2 text-left">類別</th>
                <th className="pb-2 text-right">訂價</th>
                <th className="pb-2 text-right">預約次數</th>
                <th className="pb-2 text-right">總收益</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topServices.map((s: any, i: number) => (
                <tr key={s.name}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-5 text-gray-400">#{i + 1}</span>
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-gray-500">{s.category}</td>
                  <td className="py-2.5 text-right text-gray-700">NT${s.price.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-semibold" style={{ color: 'var(--primary)' }}>{s.booking_count}</td>
                  <td className="py-2.5 text-right font-semibold text-green-600">NT${(s.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {topServices.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">尚無已完成預約</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
