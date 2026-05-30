'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', checkedin: '已到店',
  completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消'
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', checkedin: '#10B981',
  completed: '#8B5CF6', cancelled_customer: '#EF4444', cancelled_store: '#EF4444', cancelled: '#9CA3AF'
};

function AppointmentList() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  const fetchApts = () => fetch('/api/appointments').then(r => r.json()).then(setAppointments);
  useEffect(() => { fetchApts(); }, []);

  const cancel = async (id: number) => {
    if (!confirm('確定要取消此預約嗎？')) return;
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled_customer' }) });
    fetchApts();
  };

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer" className="text-gray-600 text-xl">‹</Link>
        <h1 className="font-semibold text-gray-800">我的預約</h1>
      </div>
      <div className="p-4 space-y-3">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
            ✅ 預約成功！我們將盡快與您確認。
          </div>
        )}
        {appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-400 mb-4">目前沒有預約記錄</p>
            <Link href="/customer/booking" className="px-6 py-3 text-white rounded-xl inline-block" style={{ background: '#8B7355' }}>立即預約</Link>
          </div>
        ) : appointments.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold">{apt.service_name}</div>
                <div className="text-sm text-gray-500">設計師：{apt.staff_name}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: STATUS_COLORS[apt.status] + '20', color: STATUS_COLORS[apt.status] }}>
                {STATUS_LABELS[apt.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📅 {apt.date}</span>
              <span>🕐 {apt.start_time} – {apt.end_time}</span>
            </div>
            {apt.price && <div className="text-sm font-medium mt-1" style={{ color: '#8B7355' }}>NT$ {apt.price?.toLocaleString()}</div>}
            {['pending', 'confirmed'].includes(apt.status) && (
              <button onClick={() => cancel(apt.id)} className="mt-3 px-4 py-1.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
                取消預約
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  return <Suspense><AppointmentList /></Suspense>;
}
