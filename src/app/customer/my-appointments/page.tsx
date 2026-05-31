'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconX } from '@/components/ui/Icons';

const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', checkedin: '已到店',
  completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消'
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', checkedin: '#10B981',
  completed: '#8B5CF6', cancelled_customer: '#EF4444', cancelled_store: '#EF4444', cancelled: '#9CA3AF'
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

function AppointmentList() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const [reviewApt, setReviewApt] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  const fetchApts = () => {
    setLoading(true);
    let url = '/api/appointments?';
    if (filterStatus) url += `status=${filterStatus}`;
    fetch(url).then(r => r.json()).then(d => { setAppointments(d); setLoading(false); });
  };
  useEffect(() => { fetchApts(); }, [filterStatus]);

  const cancel = async (id: number) => {
    if (!confirm('確定要取消此預約嗎？')) return;
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled_customer' }) });
    fetchApts();
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApt) return;
    setReviewLoading(true);
    const res = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: reviewApt.id, rating: reviewForm.rating, comment: reviewForm.comment }),
    });
    setReviewLoading(false);
    if (res.ok) {
      setReviewedIds(s => new Set([...s, reviewApt.id]));
      setReviewApt(null);
    }
  };

  return (
    <div>
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/customer" className="text-gray-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="font-semibold text-gray-800">我的預約</h1>
      </div>

      {/* Status filter */}
      <div className="bg-white px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFilterStatus('')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
          style={filterStatus === '' ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : { borderColor: '#E5E5E5', color: '#666' }}>
          全部
        </button>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={filterStatus === s ? { background: STATUS_COLORS[s], color: 'white', borderColor: STATUS_COLORS[s] } : { borderColor: '#E5E5E5', color: '#666' }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
            預約成功！我們將盡快與您確認。
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-3"><IconCalendar size={40} color="var(--primary-warm)" /></div>
            <p className="text-gray-400 mb-4">沒有符合條件的預約</p>
            <Link href="/customer/booking" className="px-6 py-3 text-white rounded-xl inline-block text-sm font-medium" style={{ background: 'var(--primary)' }}>立即預約</Link>
          </div>
        ) : appointments.map(apt => (
          <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold">{apt.service_name}</div>
                <div className="text-sm text-gray-500 mt-0.5">設計師：{apt.staff_name}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[apt.status] + '20', color: STATUS_COLORS[apt.status] }}>
                {STATUS_LABELS[apt.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span>{apt.date}</span>
              <span>{apt.start_time} – {apt.end_time}</span>
            </div>
            {apt.price > 0 && (
              <div className="text-sm mt-1">
                {apt.discount_amount > 0 ? (
                  <span>
                    <span className="line-through text-gray-300 mr-1">NT$ {apt.price.toLocaleString()}</span>
                    <span className="font-semibold" style={{ color: 'var(--primary)' }}>NT$ {(apt.price - apt.discount_amount).toLocaleString()}</span>
                    <span className="text-xs text-green-500 ml-1">(-{apt.discount_amount.toLocaleString()})</span>
                  </span>
                ) : (
                  <span className="font-semibold" style={{ color: 'var(--primary)' }}>NT$ {apt.price.toLocaleString()}</span>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              {['pending', 'confirmed'].includes(apt.status) && (
                <button onClick={() => cancel(apt.id)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
                  <IconX size={14} color="#EF4444" />
                  取消預約
                </button>
              )}
              {apt.status === 'completed' && !reviewedIds.has(apt.id) && (
                <button onClick={() => { setReviewApt(apt); setReviewForm({ rating: 5, comment: '' }); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50">
                  ★ 寫評價
                </button>
              )}
              {apt.status === 'completed' && reviewedIds.has(apt.id) && (
                <span className="text-xs text-gray-400 self-center flex items-center gap-1">已評價，謝謝
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewApt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">為本次服務評分</h3>
                <p className="text-xs text-gray-400 mt-0.5">{reviewApt.service_name}・{reviewApt.staff_name}</p>
              </div>
              <button onClick={() => setReviewApt(null)} className="text-gray-400 p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    className="text-3xl transition-transform hover:scale-110">
                    <span style={{ color: n <= reviewForm.rating ? '#F59E0B' : '#D1D5DB' }}>★</span>
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-amber-600 resize-none"
                placeholder="分享您的使用心得（選填）" rows={3}
                value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
              <button type="submit" disabled={reviewLoading}
                className="w-full py-3 text-white rounded-2xl text-sm font-semibold"
                style={{ background: 'var(--primary)', opacity: reviewLoading ? 0.7 : 1 }}>
                {reviewLoading ? '送出中...' : '送出評價'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyAppointmentsPage() {
  return <Suspense><AppointmentList /></Suspense>;
}
