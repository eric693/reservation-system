'use client';
import { useState, useEffect } from 'react';
import { IconTrash, IconSearch } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [data, setData] = useState<{ reviews: any[], stats: any[] }>({ reviews: [], stats: [] });
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const toast = useToast();

  const fetchData = () => fetch('/api/reviews').then(r => r.json()).then(setData);
  useEffect(() => { fetchData(); }, []);

  const togglePublic = async (id: number, current: number) => {
    const res = await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_public: current ? 0 : 1 }) });
    if (res.ok) { toast(current ? '已隱藏評價' : '已公開評價', 'success'); fetchData(); }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('確定要刪除此評價？')) return;
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    toast('已刪除', 'success'); fetchData();
  };

  const filtered = data.reviews.filter(r =>
    (!filterRating || r.rating === filterRating) &&
    (!search || r.customer_name?.includes(search) || r.comment?.includes(search))
  );

  const avgRating = data.reviews.length ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1) : '—';
  const dist = [5,4,3,2,1].map(n => ({ n, count: data.reviews.filter(r => r.rating === n).length }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">評價管理</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold" style={{ color: '#F59E0B' }}>{avgRating}</div>
          <div className="text-sm text-gray-400 mt-0.5">平均評分 · {data.reviews.length} 則</div>
          {data.reviews.length > 0 && <Stars rating={Math.round(Number(avgRating))} />}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-1">
          {dist.map(d => (
            <div key={d.n} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-gray-500">{d.n}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: data.reviews.length ? `${(d.count/data.reviews.length)*100}%` : '0%' }} />
              </div>
              <span className="w-4 text-gray-400">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-40" style={{ paddingLeft:'28px', paddingRight:'12px' }}
            placeholder="搜尋顧客/評論" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[0,5,4,3,2,1].map(n => (
            <button key={n} onClick={() => setFilterRating(n)}
              className="px-3 py-1.5 text-sm rounded-lg border transition-colors"
              style={filterRating === n ? { background: '#F59E0B', color: 'white', borderColor: '#F59E0B' } : { borderColor: '#E5E5E5' }}>
              {n === 0 ? '全部' : `${n}★`}
            </button>
          ))}
        </div>
        <button onClick={() => { setSearch(''); setFilterRating(0); }} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">尚無評價</div>
        ) : filtered.map(r => (
          <div key={r.id} className={`bg-white rounded-xl p-4 shadow-sm ${!r.is_public ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.customer_name || '匿名'}</span>
                  <Stars rating={r.rating} />
                  {!r.is_public && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">已隱藏</span>}
                </div>
                <p className="text-sm text-gray-600">{r.comment || <span className="text-gray-300">（無留言）</span>}</p>
                <div className="text-xs text-gray-400 mt-1">{r.service_name} · {r.staff_name} · {r.created_at?.slice(0,10)}</div>
              </div>
              <div className="flex gap-2 ml-3">
                <button onClick={() => togglePublic(r.id, r.is_public)} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">
                  {r.is_public ? '隱藏' : '公開'}
                </button>
                <button onClick={() => deleteReview(r.id)} className="p-1.5 border border-red-100 rounded hover:bg-red-50">
                  <IconTrash size={13} color="#EF4444" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
